/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Profile
 * @flow
 */


'use strict';

var React = require('react-native');

var {
    ActivityIndicatorIOS,
    AsyncStorage,
    Image,
    LayoutAnimation,
    Navigator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
    } = React;

var _ = require('lodash');
var DDPClient = require('ddp-client');
var Display = require('react-native-device-display');
var EditProfilePageIcon = require('../../Partials/Icons/EditProfilePageIcon');
var EditProfile = require('../EditProfile');
var FBLogin = require('react-native-facebook-login');
var FB_PHOTO_WIDTH = 360;
var Header = require('../../Partials/Header');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var LoginPage = require('../Login');
var sha256 = require('sha256');

var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};

function getAgeRangeLimits(ageValue:number, limit:string) {
    if (limit === 'upper') {
        if (ageValue <= 18) return 19;
        else return ageValue + (ageValue - 18);
    } else if (limit === 'lower') {
        if (ageValue <= 18) return 18;
        else return ageValue - (ageValue - 18);
    }
}

function hash(msg:string) {
    return sha256(sha256(sha256(msg)));
}

function prepAgeRangeValue(ageRangeObject:Object) {
    if (!ageRangeObject.max) _.assign(ageRangeObject, {max: ageRangeObject.min});
    return ageRangeObject;
}

var Profile = React.createClass({
    statics: {
        title: '<Profile>',
        description: 'See current user profile here.'
    },

    getInitialState() {
        return {
            user: null
        }
    },

    _updateAccountLoginStatus(value:boolean) {
        var ddpClient = new DDPClient({
            ssl: true,
            url: 'wss://lb1.ventureappofficial.me/websocket',
        });
        var user = this.state.user;
        var api = `https://graph.facebook.com/v2.3/${user && user.userId}?fields=name,email,gender,age_range&access_token=${user.token}`;
        var ventureId = hash(user.userId);

        if (!value) {
            AsyncStorage.setItem('@AsyncStorage:Venture:account', 'null')
                .then(() => console.log('Clear Venture account from AsyncStorage'))
                .catch((error) => console.log(error.message))
                .done();
        }

        ddpClient.connect((err, wasReconnect) => {
            if (err) {
                console.log('DDP connection error!');
                return;
            }
            if (wasReconnect) {
                console.log('Reestablishment of a connection.');
            }

            ddpClient.call('Accounts.getUser', [{ventureId}],
                function (err, resp) {

                    if (resp) {
                        fetch(api)
                            .then((response) => response.json())
                            .then((responseData) => {
                                ddpClient.call('Accounts.updateUser', [{ventureId},
                                        {'status.online': value},
                                        ventureId,
                                        responseData.name,
                                        responseData.email],
                                    function (err, resp) {
                                        if (resp) console.log('Updated user account to status.online: ' + value);
                                        if (err) console.log(err);

                                        ddpClient.close();
                                    });

                                if (value) {
                                    AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(_.assign(resp, {
                                        ventureId,
                                        name: responseData.name,
                                        email: responseData.email
                                    })))
                                        .then(() => console.log('Saved Venture account: ' + JSON.stringify(_.assign(resp, {
                                                ventureId,
                                                name: responseData.name,
                                                email: responseData.email
                                            }))))
                                        .catch((error) => console.log(error.message))
                                        .done();
                                }
                            })
                            .done();
                    }

                    if (err) {
                        if (value) {
                            fetch(api)
                                .then((response) => response.json())
                                .then((responseData) => {

                                    var picture = null;

                                    var newUser = {
                                        ventureId: ventureId,
                                        name: responseData.name,
                                        firstName: responseData.name.split(' ')[0],
                                        lastName: responseData.name.split(' ')[1],
                                        activityPreference: 'explore',
                                        picture: `https://res.cloudinary.com/dwnyawluh/image/facebook/${user.userId}.jpg`,
                                        gender: responseData.gender,
                                        bio: 'New to Venture!',
                                        email: responseData.email,
                                        ageRange: prepAgeRangeValue(responseData.age_range),
                                        location: {
                                            type: 'Point',
                                            coordinates: [-72.93, 41.312]
                                        },
                                        matchingPreferences: {
                                            maxSearchDistance: 1.0,
                                            ageRangeLower: getAgeRangeLimits(responseData.age_range.min, 'lower'),
                                            ageRangeUpper: getAgeRangeLimits(responseData.age_range.min, 'upper'),
                                            genderPreferences: ['male', 'female', 'other']
                                        },
                                        discoveryPreferences: {
                                            genderInclusions: [responseData.gender]
                                        },
                                        status: {
                                            online: value
                                        }
                                    };

                                    ddpClient.call('Accounts.addUser', [newUser, ventureId, ventureId],
                                        function (err, resp) {
                                            if (resp) console.log('Added to AccountsSvc db.');
                                            if (err) console.log(err.message);

                                            ddpClient.close();
                                        });

                                    AsyncStorage.setItem('@AsyncStorage:Venture:account',
                                        JSON.stringify(_.assign(_.pick(newUser, 'firstName', 'activityPreference', 'picture', 'bio', 'gender')), {
                                            ventureId,
                                            name: responseData.name,
                                            email: responseData.email
                                        }))
                                        .then(() => console.log('Saved Venture account: ' +
                                            JSON.stringify(_.assign(_.pick(newUser, 'firstName', 'activityPreference', 'picture', 'bio', 'gender')), {
                                                ventureId,
                                                name: responseData.name,
                                                email: responseData.email
                                            })))
                                        .catch((error) => console.log(error.message))
                                        .done();

                                })
                                .done();
                        }
                    }
                }
            );

        });
    },

    render() {

        var _this = this,
            user = this.state.user;

        return (
            <View style={{flex: 1}}>
                <View>
                    {this.renderHeader()}
                </View>
                <Image source={require('image!about')}
                    style={styles.signInContainer}>
                    <View style={styles.loginContainer}>
                        { user && <Photo user={user}/> }
                        { user && <Info user={user}/>}

                        <FBLogin style={styles.FBLoginButton}
                                 permissions={['email', 'user_friends']}
                                 onLogin={function(data) {

                                _this.setState({user : data.credentials });

                                  AsyncStorage.setItem('@AsyncStorage:Venture:isLoggedIn', 'true')
                                    .then(() => _this._updateAccountLoginStatus(true))
                                    .then(() => console.log('Logged in!'))
                                    .catch((error) => console.log(error.message))
                                    .done();
                                }}

                                 onLogout={function(){
                                    _this.setState({user : null });

                                    // bring up sign in modal
                                    _this.props.navigator.push({title: 'LoginPage', component: LoginPage});

                          AsyncStorage.setItem('@AsyncStorage:Venture:isLoggedIn', 'false')
                            .then(() => _this._updateAccountLoginStatus(false))
                            .then(() => console.log('Logged in!'))
                            .catch((error) => console.log(error.message))
                            .done();
                    }}
                                 onLoginFound={function(data){
                        _this.setState({ user : data.credentials });

                        console.log("Existing login found.");
                    }}
                                 onLoginNotFound={function(){
                        _this.setState({ user : null });

                        console.log("No user logged in.");
                    }}
                                 onError={function(data){
                        console.error("Error in fetching facebook data: ", data);
                    }}
                                 onCancel={function(){
                        console.log("User cancelled.");
                    }}
                                 onPermissionsMissing={function(data){
                        console.error("Check permissions!");
                    }}
                            />
                    </View>
                </Image>
            </View>
        )
    },

    renderHeader() {
        return (
            <View style={styles.header}>
                <HomeIcon onPress={() => this.props.navigator.popToTop()} />
                <EditProfilePageIcon  onPress={() => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                this.props.navigator.push({title: 'EditProfile', component: EditProfile})
                                }} />
            </View>
        )
    }
});

var Photo = React.createClass({
    propTypes: {
        user: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            photo: null
        };
    },

    componentWillMount() {
        var user = this.props.user;
        var api = `https://graph.facebook.com/v2.3/${user.userId}/picture?width=${FB_PHOTO_WIDTH}&redirect=false&access_token=${user.token}`;
        var _this = this;

        fetch(api)
            .then((response) => response.json())
            .then((responseData) => {
                _this.setState({
                    photo: {
                        url: responseData.data.url,
                        height: responseData.data.height,
                        width: responseData.data.width
                    }
                });
            })
            .done();
    },

    render() {
        var photo = this.state.photo;

        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

        return (
            <View style={styles.photoContent}>

                <Image
                    style={photo &&
            {
              height: SCREEN_WIDTH/1.8,
              width: SCREEN_WIDTH/1.8,
              borderRadius: SCREEN_WIDTH/3.6,
              bottom: 20
            }
          }
                    source={{uri: photo && photo.url}}
                    />
            </View>
        );
    },
    _renderLoadingView() {
        return (
            <View style={styles.loadingViewContainer}>
                <ActivityIndicatorIOS
                    color='#eee'
                    animating={true}
                    style={{height: 80}}
                    size="large"/>
            </View>
        );
    }
});

var Info = React.createClass({
    propTypes: {
        user: React.PropTypes.object.isRequired
    },

    getInitialState() {
        return {
            info: null
        };
    },
    componentWillMount() {
        var _this = this;
        var user = this.props.user;
        var api = `https://graph.facebook.com/v2.3/${user.userId}?fields=name,email,gender,age_range&access_token=${user.token}`;

        fetch(api)
            .then((response) => response.json())
            .then((responseData) => {
                _this.setState({
                    info: {
                        name: responseData.name,
                        email: responseData.email,
                        gender: responseData.gender,
                        ageRange: responseData.age_range
                    },
                    ready: true
                });
            })
            .done();
    },
    render() {
        var info = this.state.info;

        return (
            <View style={styles.infoContent}>
                <Text style={[styles.infoText]}>{ info && (info.name + ', ') } { info && info.ageRange.min }</Text>
                <Text style={[styles.infoText, styles.infoTextGender]}>{ info && info.gender && info.gender.capitalize() }</Text>
                <Text style={[styles.infoText, styles.infoTextBio]}>{ 'Yale \'16' }</Text>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    FBLoginButton: {
        top: 70
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#040A19',
        paddingTop: 20,
        paddingBottom: 5
    },
    infoContent: {
        paddingVertical: 20
    },
    infoText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    loadingViewContainer: {
        flex: 1,
        alignItems: 'center',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    loginContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 20,
        bottom: 40,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    photoContent: {
        paddingTop: 20
    },
    signInContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    }
});

module.exports = Profile;