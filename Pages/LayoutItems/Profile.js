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
var Display = require('react-native-device-display');
var EditProfilePageIcon = require('../../Partials/Icons/EditProfilePageIcon');
var EditProfile = require('../EditProfile');
var FBLogin = require('react-native-facebook-login');
var Firebase = require('firebase');
var Header = require('../../Partials/Header');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var Login = require('../Login');
var sha256 = require('sha256');
var TimerMixin = require('react-timer-mixin');

var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;

String.prototype.capitalize = () => this.replace(/(?:^|\s)\S/g, a => a.toUpperCase());

var getInitialAgeRangeLimits = (ageVal:number, lim:string) => {
    if (lim === 'upper') {
        if (ageVal <= 18) return 19;
        else return ageVal + (ageVal - 18);
    } else {
        if (ageVal <= 18) return 18;
        else return ageVal - (ageVal - 18);
    }
};

var hash = (msg:string) => sha256(sha256(sha256(msg)));

var prepAgeRangeVal = (ageRangeObj:Object):{max:number, min: number, exactVal: number} => {
    if (!ageRangeObj.max) _.assign(ageRangeObj, {max: ageRangeObj.min});
    return _.assign(ageRangeObj, {exactVal: ageRangeObj.min});
};

var Profile = React.createClass({
    statics: {
        title: '<Profile>',
        description: 'See current user info.'
    },

    mixins: [TimerMixin],

    getInitialState() {
        return {
            asyncObj: null,
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            user: null
        }
    },

    _createAccount() {
        let user = this.state.user,
            ventureId = this.state.ventureId,
            api = `https://graph.facebook.com/v2.3/${user && user.userId}?fields=name,email,gender,age_range&access_token=${user.token}`;

        fetch(api)
            .then(response => response.json())
            .then(responseData => {

                let newUserData = {
                    ventureId,
                    name: responseData.name,
                    firstName: responseData.name.split(' ')[0],
                    lastName: responseData.name.split(' ')[1],
                    activityPreference: {
                        title: 'EXPLORE?',
                        status: 'now',
                        start: {
                            time: '',
                            dateTime: '',
                            timeZoneOffsetInHours: ''
                        },
                        tags: [],
                        created: new Date(),
                        updated: new Date()
                    },
                    picture: `https://res.cloudinary.com/dwnyawluh/image/facebook/${this.state.user.userId}.jpg`,
                    gender: responseData.gender,
                    bio: 'New to Venture!',
                    email: responseData.email,
                    ageRange: prepAgeRangeVal(responseData.age_range),
                    location: {
                        type: 'Point',
                        coordinates: []
                    },
                    matchingPreferences: {
                        maxSearchDistance: 10.0,
                        ageRangeLower: getInitialAgeRangeLimits(responseData.age_range.min, 'lower'),
                        ageRangeUpper: getInitialAgeRangeLimits(responseData.age_range.min, 'upper'),
                        gender: ['male', 'female', 'other'],
                        privacy: ['friends', 'friends+', 'all']
                    },
                    discoveryPreferences: {
                        genderInclusions: [responseData.gender]
                    },
                    status: {
                        isOnline: true
                    },
                    match_requests: {},
                    events: [],
                    event_invite_match_requests: {}
                };

                this.state.firebaseRef.child(`users/${ventureId}`).set(newUserData);
            })
            .done();
    },

    _safelyNavigateToHome() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
            homeRoute = currentRouteStack[0];

        if(currentRouteStack.indexOf(homeRoute) > -1) this.props.navigator.jumpTo(homeRoute);
    },

    _safelyNavigateForward(route:{title:string, component:ReactClass<any,any,any>, passProps?:Object}) {
        let abbrevRoute = _.omit(route, 'component'),
            currentRouteStack = this.props.navigator.getCurrentRoutes();

        if(currentRouteStack.indexOf(abbrevRoute) > -1) this.props.navigator.jumpTo(abbrevRoute);
        else {
            currentRouteStack.push(route);
            this.props.navigator.immediatelyResetRouteStack(currentRouteStack)
        }
    },

    _updateUserLoginStatus(isOnline:boolean) {
        let ventureId = this.state.ventureId,
            currentUserRef = this.state.firebaseRef.child(`users/${ventureId}`),
            loginStatusRef = currentUserRef.child(`status/isOnline`),
            _this = this;

        if (!isOnline) {
            loginStatusRef.set(false);

            AsyncStorage.setItem('@AsyncStorage:Venture:account', 'null')
                .catch(error => console.log(error.message))
                .done();

            return;
        }

        loginStatusRef.once('value', snapshot => {
            if (snapshot.val() === null) _this._createAccount(ventureId);
            else if (isOnline) loginStatusRef.set(isOnline);

            currentUserRef.once('value', snapshot => {
                let asyncObj = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName', 'lastName', 'activityPreference', 'age', 'picture', 'bio', 'gender', 'matchingPreferences');

                // @hmm: slight defer to allow for snapshot.val()
                this.setTimeout(() => {
                    AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(asyncObj))
                        .then(() => {
                            //@hmm: get current user location & save to firebase object
                            navigator.geolocation.getCurrentPosition(
                                (currentPosition) => {
                                    currentUserRef.child(`location/coordinates`).set(currentPosition.coords)
                                },
                                (error) => {
                                    console.error(error);
                                },
                                {enableHighAccuracy: true, timeout: 1000, maximumAge: 1000}
                            );
                        })
                        .catch(error => console.log(error.message))
                        .done();
                }, 0);
            });

        });
    },

    render() {
        let _this = this,
            user = this.state.user,
            ventureId = this.state.ventureId

        return (
            <View style={styles.container}>
                <View>
                    {this.renderHeader()}
                </View>
                <Image source={require('image!about')}
                       style={styles.backdrop}>
                    <View style={styles.loginContainer}>
                        <View>
                            { user && <Photo user={user}/> }
                            { user && ventureId && <Info ventureId={ventureId} user={user}/>}
                        </View>

                        <FBLogin style={styles.FBLoginButton}
                                 permissions={['email', 'user_friends']}
                                 onLogin={function(data) {

                                _this.setState({user: data.credentials, ventureId: hash(data.credentials.userId)});

                                  AsyncStorage.setItem('@AsyncStorage:Venture:isOnline', 'true')
                                    .then(() => _this._updateUserLoginStatus(true))
                                    .then(() => console.log('Logged in!'))
                                    .catch((error) => console.log(error.message))
                                    .done();

                                }}

                                 onLogout={function(){

                                    _this.props.navigator.push({title: 'Login', component: Login});
                                    _this.setState({user : null, ventureId: null});
                                    _this._updateUserLoginStatus(false);

                                  AsyncStorage.setItem('@AsyncStorage:Venture:isOnline', 'false')
                                    .then(() => console.log('Logged out!'))
                                    .catch((error) => console.log(error.message))
                                    .done();

                                  AsyncStorage.setItem('@AsyncStorage:Venture:currentUser:friendsAPICallURL', 'null')
                                    .catch(error => console.log(error.message))
                                    .done();
                                }}

                                 onLoginFound={function(data){


                                _this.setState({ user : data.credentials, ventureId: hash(data.credentials.userId)});

                                console.log("Existing login found.");

                                }}

                                 onLoginNotFound={function(){

                                _this.setState({ user : null, ventureId: null });

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
            <Header containerStyle={{backgroundColor: '#040A19'}}>
                    <HomeIcon onPress={() => {
                        this._safelyNavigateToHome();
                    }} style={{right: 14}}/>
                <Text>MY PROFILE</Text>
                    <EditProfilePageIcon
                        onPress={() => {
                          this._safelyNavigateForward({title: 'EditProfile',component: EditProfile,  passProps: {ventureId: this.state.ventureId}});
                    }} style={{left: 14}}/>
            </Header>
        )
    }
});

var Photo = React.createClass({
    propTypes: {
        user: React.PropTypes.object.isRequired
    },

    render() {
        if (this.props.user.userId) {
            return (
                <View style={styles.photoContent}>
                    <Image
                        style={
                    {
                      height: SCREEN_WIDTH/1.8,
                      width: SCREEN_WIDTH/1.8,
                      borderRadius: SCREEN_WIDTH/3.6,
                      bottom: 20
                    }
                  }
                        source={{uri: `https://res.cloudinary.com/dwnyawluh/image/facebook/${this.props.user.userId}.jpg`}}
                        />
                </View>
            );
        }
    }
});

var Info = React.createClass({
    propTypes: {
        user: React.PropTypes.object.isRequired,
        ventureId: React.PropTypes.string
    },

    getInitialState() {
        return {
            info: null,
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            renderLoadingView: true
        };
    },
    componentWillMount() {
        let _this = this,
            firebaseUserData = this.state.firebaseRef.child(`users/${this.props.ventureId}`);

        firebaseUserData.on('value', snapshot =>
                _this.setState({
                    firebaseUserData,
                    renderLoadingView: false,
                    info: {
                        firstName: snapshot.val() && snapshot.val().firstName,
                        gender: snapshot.val() && snapshot.val().gender,
                        ageRange: snapshot.val() && snapshot.val().ageRange,
                        bio: snapshot.val() && snapshot.val().bio
                    }
                })
        );
    },

    componentDidMount() {
        let api = `https://graph.facebook.com/v2.3/${this.props.user && this.props.user.userId}/friends?access_token=${this.props.user && this.props.user.token}`;

        AsyncStorage.setItem('@AsyncStorage:Venture:currentUser:friendsAPICallURL', api)
            .catch(error => console.log(error.message))
            .done();
    },

    componentWillUnmount() {
      this.state.firebaseUserData && this.state.firebaseUserData.off();
    },

    render() {
        let info = this.state.info;

        if (this.state.renderLoadingView) {
            return this._renderLoadingView();
        }

        return (
            <View style={styles.infoContent}>
                <Text
                    style={[styles.infoText, styles.infoTextNameAge]}>{ info && (info.firstName + ', ') } { info && info.ageRange && info.ageRange.min }</Text>
                <Text
                    style={[styles.infoText, styles.infoTextGender]}>{ info && info.gender && info.gender.capitalize() }</Text>
                <Text style={[styles.infoText, styles.infoTextBio]}>{ info && info.bio }</Text>
            </View>
        );
    },

    _renderLoadingView() {
        return (
            <View style={{alignSelf: 'center'}}>
                <Text style={{color: '#fff'}}>Loading...</Text>
                <ActivityIndicatorIOS
                    color='#eee'
                    animating={true}
                    style={styles.loadingViewActivityIndicatorIOS}
                    size="small"/>
            </View>
        );
    }
});

var styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
    },
    container: {
        flex: 1
    },
    FBLoginButton: {
        top: 70
    },
    infoContent: {
        paddingLeft: 20,
        paddingTop: 20
    },
    infoText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    infoTextNameAge: {
        fontSize: 24
    },
    loadingViewActivityIndicatorIOS: {
        height: 80,
        alignSelf: 'center'
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
    }
});

module.exports = Profile;