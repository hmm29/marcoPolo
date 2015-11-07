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
var Dimensions = require('Dimensions');
var EditProfilePageIcon = require('../../Partials/Icons/EditProfilePageIcon');
var EditProfile = require('../EditProfile');
var FBLogin = require('react-native-facebook-login');
var Firebase = require('firebase');
var Header = require('../../Partials/Header');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var Login = require('../Login');
var sha256 = require('sha256');
var TimerMixin = require('react-timer-mixin');

var SCREEN_WIDTH = Dimensions.get('window').width;
var SCREEN_HEIGHT = Dimensions.get('window').height;

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

var Profile = React.createClass({
    statics: {
        title: '<Profile>',
        description: 'See current user info.'
    },

    mixins: [TimerMixin],

    getInitialState() {
        return {
            asyncObj: null,
            firebaseRef: this.props.firebaseRef,
            user: null
        }
    },

    componentWillUnmount() {
        this.state.firebaseRef.off();
    },

    _safelyNavigateToHome() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
            homeRoute = currentRouteStack[0];

        if (currentRouteStack.indexOf(homeRoute) > -1) this.props.navigator.jumpTo(homeRoute);
    },

    _safelyNavigateForward(route:{title:string, component:ReactClass<any,any,any>, passProps?:Object}) {
        let abbrevRoute = _.omit(route, 'component'),
            currentRouteStack = this.props.navigator.getCurrentRoutes();

        if (!!_.findWhere(currentRouteStack, abbrevRoute)) this.props.navigator.jumpTo(_.findWhere(currentRouteStack, abbrevRoute));
        else {
            // alert('new edit profile: ' + JSON.stringify(this.props.navigator.getCurrentRoutes()))
            // alert(this.props.navigator.getCurrentRoutes().length)

            currentRouteStack.push(route);
            this.props.navigator.immediatelyResetRouteStack(currentRouteStack)
        }
    },

    _updateUserLoginStatus(isOnline:boolean) {
        if(!this.state.firebaseRef) {
            this.setState({firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/')})
        }

        let ventureId = this.state.ventureId,
            usersListRef = this.state.firebaseRef && this.state.firebaseRef.child('users'),
            currentUserRef = usersListRef && usersListRef.child(ventureId),
            loginStatusRef = currentUserRef && currentUserRef.child(`status/isOnline`);

        if (!isOnline) {
            loginStatusRef.set(false);
            currentUserRef.child('match_requests').set(null); // @hmm: clear users match interactions

            usersListRef.once('value', snapshot => {
                snapshot.val() && _.each(snapshot.val(), (user) => {
                    if (user.match_requests && user.match_requests[ventureId]) {
                        usersListRef.child(`${user.ventureId}/match_requests/${ventureId}`).set(null);
                    }

                    if (user.event_invite_match_requests && user.event_invite_match_requests[ventureId]) {
                        usersListRef.child(`${user.ventureId}/event_invite_match_requests/${ventureId}`).set(null);
                    }
                });
            });

            return;
        }

        if (isOnline) loginStatusRef.set(isOnline);

        currentUserRef.once('value', snapshot => {
            let asyncObj = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName', 'lastName', 'activityPreference', 'age', 'picture', 'bio', 'gender', 'matchingPreferences');

            // @hmm: slight defer to allow time for snapshot.val()
            this.setTimeout(() => {
                AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(asyncObj))
                    .then(() => this._navigateToNextPage())
                    .catch(error => console.log(error.message))
                    .done();
            }, 0);
        });
    },

    render() {
        let _this = this,
            user = this.state.user,
            ventureId = this.state.ventureId;

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
                                 onLogout={function(){

                                    _this.props.navigator.immediatelyResetRouteStack([{title: 'Login', component: Login}]);

                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    _this.setState({user : null, ventureId: null});
                                    _this._updateUserLoginStatus(false);

                                     AsyncStorage.multiRemove(['@AsyncStorage:Venture:account', '@AsyncStorage:Venture:currentUser:friendsAPICallURL', '@AsyncStorage:Venture:currentUserFriends', '@AsyncStorage:Venture:isOnline'])
                                        .catch(error => console.log(error.message))
                                        .done();
                                }}

                                 onLoginFound={function(data){


                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                _this.setState({ user : data.credentials, ventureId: hash(data.credentials.userId)});

                                console.log("Existing login found.");

                                }}

                                 onLoginNotFound={function(){

                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
                          this._safelyNavigateForward({title: 'EditProfile',component: EditProfile,  passProps: {firebaseRef: this.state.firebaseRef, ventureId: this.state.ventureId}});
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
                        source={{uri: `https://res.cloudinary.com/dwnyawluh/image/facebook/q_80/${this.props.user.userId}.jpg`}}
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
            firebaseCurrentUserData = this.state.firebaseRef.child(`users/${this.props.ventureId}`);

        firebaseCurrentUserData.on('value', snapshot =>
                _this.setState({
                    firebaseCurrentUserData,
                    renderLoadingView: false,
                    info: {
                        firstName: snapshot.val() && snapshot.val().firstName,
                        gender: snapshot.val() && snapshot.val().gender,
                        age: snapshot.val() && snapshot.val().age,
                        bio: snapshot.val() && snapshot.val().bio
                    }
                })
        );
    },

    componentWillUnmount() {
        this.state.firebaseCurrentUserData && this.state.firebaseCurrentUserData.off();
    },

    render() {
        let info = this.state.info;

        if (this.state.renderLoadingView) {
            return this._renderLoadingView();
        }

        return (
            <View style={styles.infoContent}>
                <Text
                    style={[styles.infoText, styles.infoTextNameAge]}>{ info && (info.firstName + ', ') } { info && info.age && info.age.value }</Text>
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
        backgroundColor: 'transparent'
    },
    container: {
        flex: 1,
        backgroundColor: '#02030F'
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
    infoTextBio: {
        width: SCREEN_WIDTH / 2,
        textAlign: 'left'
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