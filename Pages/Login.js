/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Login
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    AsyncStorage,
    Image,
    PixelRatio,
    StyleSheet,
    Text,
    View
    } = React;

var _ = require('lodash');
var Display = require('react-native-device-display');
var FBLogin = require('react-native-facebook-login');
var Firebase = require('firebase');
var Home = require('./Home');
var sha256 = require('sha256');
var Swiper = require('react-native-swiper');
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
    if (!ageRangeObj.max) _.assign(ageRangeObj, {max: ageRangeObj.min, exactVal: ageRangeObj.min});
    return ageRangeObj;
};

var Login = React.createClass({
    statics: {
        title: '<Login>',
        description: 'Log into the Venture App.'
    },

    mixins: [TimerMixin],

    getInitialState() {
        return {
            asyncObj: null,
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            user: null
        }
    },

    componentWillMount() {
        AsyncStorage.setItem('@AsyncStorage:Venture:account', 'null')
            .catch(error => console.log(error.message))
            .done();
    },

    _createAccount() {
        let user = this.state.user,
            ventureId = this.state.ventureId,
            pixelRatioCalc = PixelRatio.getPixelSizeForLayoutSize(200),
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
                        title: 'explore',
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
                    picture: `https://res.cloudinary.com/dwnyawluh/image/facebook/w_${pixelRatioCalc},h_${pixelRatioCalc}/${this.state.user.userId}.jpg`,
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
                    events: []
                };

                this.state.firebaseRef.child(`users/${ventureId}`).set(newUserData);
            })
            .done();
    },

    _navigateToNextPage() {
        var Home = require('./Home');

        this.props.navigator.popToTop();
        this.props.navigator.replace({title: 'Home', component: Home})
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
        let _this = this;

        return (
            <View>
                    <Swiper style={styles.wrapper}
                            dot={<View style={{backgroundColor:'rgba(255,255,255,.3)', width: 13, height: 13,borderRadius: 7, top: SCREEN_HEIGHT / 30, marginLeft: 7, marginRight: 7,}} />}
                            activeDot={<View style={{backgroundColor: '#fff', width: 13, height: 13, borderRadius: 7, top: SCREEN_HEIGHT / 30, marginLeft: 7, marginRight: 7}} />}
                            paginationStyle={{bottom: 70,}}
                            loop={false}>
                        <View style={styles.slide}>
                            <Image
                                source={require('image!HomeBackground')}
                                style={styles.backdrop}>

                                <Image source={require('image!VentureLogoWhite')}
                                       style={styles.ventureLogo}/>

                                <FBLogin style={{ top: 40 }}
                                         permissions={['email','user_friends']}
                                         onLogin={function(data){

                                _this.setState({user: data.credentials, ventureId: hash(data.credentials.userId)});

                                  AsyncStorage.setItem('@AsyncStorage:Venture:isOnline', 'true')
                                    .then(() => {
                                        _this._updateUserLoginStatus(true);
                                        _this._navigateToNextPage();
                                    })
                                    .then(() => console.log('Logged in!'))
                                    .catch((error) => console.log(error.message))
                                    .done();
                        }}
                                    />
                            </Image>
                        </View>
                        <View style={styles.slide}>
                        </View>
                        <View style={styles.slide}>
                        </View>
                    </Swiper>
            </View>
        )
    }
});

var styles = StyleSheet.create({
    backdrop: {
        paddingTop: 30,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    tabText: {
        color: 'white',
        bottom: 190,
        fontFamily: 'AvenirNextCondensed-Medium',
        fontSize: 30
    },
    ventureLogo: {
        bottom: 54,
        width: 120,
        height: 92.62,
        backgroundColor: 'transparent'
    },
    wrapper: {
        // backgroundColor: '#f00',
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    image: {
        flex: 1,
    }
});

module.exports = Login;