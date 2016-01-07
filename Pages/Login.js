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
    AlertIOS,
    AsyncStorage,
    Image,
    LayoutAnimation,
    PixelRatio,
    StyleSheet,
    Text,
    View
    } = React;

var _ = require('lodash');
var Dimensions = require('Dimensions');
var FBLogin = require('react-native-facebook-login');
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

var Login = React.createClass({
    statics: {
        title: '<Login>',
        description: 'Log into the Venture App.'
    },

    mixins: [TimerMixin],

    getInitialState() {
        var Firebase = require('firebase');

        return {
            asyncObj: null,
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            user: null
        }
    },

    componentWillMount() {
        AsyncStorage.removeItem('@AsyncStorage:Venture:account')
            .catch(error => console.log(error.message))
            .done();
    },

    _createAccount() {
        let user = this.state.user,
            ventureId = this.state.ventureId,
            api = `https://graph.facebook.com/v2.3/${user && user.userId}?fields=name,email,gender,age_range&access_token=${user.token}`;

        fetch(api)
            .then(response => response.json())
            .then(responseData => {
                let ageRange = responseData.age_range;

                if(ageRange.max === 17 && ageRange.min === 13) {
                    this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(17);
                    this._setAsyncStorageAccountData();
                }

                else if(ageRange.max === 20 && ageRange.min === 18) {
                    AlertIOS.alert(
                        'Venture: Specify Your Age',
                        'Venture uses age to give you the best experience with activity partners.',
                        [
                            {text: '18', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(18);
                                this._setAsyncStorageAccountData();
                            }},
                            {text: '19', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(19);
                                this._setAsyncStorageAccountData();
                            }},
                            {text: '20', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(20);
                                this._setAsyncStorageAccountData();
                            }}
                        ]
                    )
                }

                else if (ageRange.min === 21) {
                    AlertIOS.alert(
                        'Venture: Specify Your Age',
                        'Venture uses age to give you the best experience with activity partners.',
                        [
                            {text: '21', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(21);
                                this._setAsyncStorageAccountData();
                            }},
                            {text: '22', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(22);
                                this._setAsyncStorageAccountData();
                            }},
                            {text: '23', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(23);
                                this._setAsyncStorageAccountData();
                            }},
                            {text: '24', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(24);
                                this._setAsyncStorageAccountData();
                            }},
                            {text: '25', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set(25);
                                this._setAsyncStorageAccountData();
                            }},
                            {text: '25+', onPress: () => {
                                this.state.firebaseRef.child(`users/${ventureId}/age/value`).set('25+');
                                this._setAsyncStorageAccountData();
                            }}
                        ]
                    )
                }

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
                    picture: `https://res.cloudinary.com/dwnyawluh/image/facebook/q_80/${this.state.user.userId}.jpg`,
                    gender: responseData.gender,
                    bio: 'New to Venture!',
                    email: responseData.email,
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
                    event_invite_match_requests: {},
                    createdAt: new Date()
                };

                this.state.firebaseRef.child(`users/${ventureId}`).set(newUserData);
            })
            .done();
    },

    _navigateToNextPage() {
        //@hmm: IMPORTANT, must lazy load home for this to work
        var Home = require('./Home');

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        this.props.navigator.popToTop();
        this.props.navigator.replace({title: 'Home', component: Home})
    },

    _updateUserLoginStatus(isOnline:boolean) {
        let ventureId = this.state.ventureId,
            currentUserRef = this.state.firebaseRef.child(`users/${ventureId}`),
            loginStatusRef = currentUserRef.child(`status/isOnline`),
            _this = this;

        loginStatusRef.once('value', snapshot => {
            if (snapshot.val() === null) _this._createAccount(ventureId);
            else if (isOnline) {
                loginStatusRef.set(isOnline);

                currentUserRef.once('value', snapshot => {
                    let asyncObj = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName', 'lastName', 'activityPreference', 'age', 'picture', 'bio', 'gender', 'matchingPreferences');

                    // @hmm: slight defer to allow for snapshot.val()
                    this.setTimeout(() => {
                        AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(asyncObj))
                            .then(() => this._navigateToNextPage())
                            .catch(error => console.log(error.message))
                            .done();
                    }, 0);
                });
            }
        });
    },

    _setAsyncStorageAccountData() {
      let ventureId = this.state.ventureId,
          currentUserRef = this.state.firebaseRef && this.state.firebaseRef.child(`users/${ventureId}`);

        currentUserRef.once('value', snapshot => {
            let asyncObj = _.pick(snapshot.val(), 'ventureId', 'name', 'firstName', 'lastName', 'activityPreference', 'age', 'picture', 'bio', 'gender', 'matchingPreferences');

            AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(asyncObj))
                .then(() => this._navigateToNextPage())
                .catch(error => console.log(error.message))
                .done();
        });
    },

    render() {
        var Swiper = require('react-native-swiper');
        let _this = this;

        return (
            <View>
                <Image>
                    <Swiper style={styles.wrapper}
                            dot={<View style={{backgroundColor:'rgba(255,255,255,.3)', width: 13, height: 13,borderRadius: 7, top: SCREEN_HEIGHT / 30, marginLeft: 7, marginRight: 7,}} />}
                            activeDot={<View style={{backgroundColor: '#fff', width: 13, height: 13, borderRadius: 7, top: SCREEN_HEIGHT / 30, marginLeft: 7, marginRight: 7}} />}
                            paginationStyle={{bottom: SCREEN_HEIGHT/22}}
                            loop={false}>
                        <View style={styles.slide}>
                            <Image
                                resizeMode={Image.resizeMode.stretch}
                                source={require('./../img/OnboardingFacebookSignUp.png')}
                                style={styles.backdrop}>

                                <Image
                                       style={styles.ventureLogo}/>

                                <FBLogin style={{ top: SCREEN_HEIGHT/3 }}
                                         permissions={['email','user_friends']}
                                         onLogin={function(data){

                                let api = `https://graph.facebook.com/v2.3/${data.credentials && data.credentials.userId}/friends?access_token=${data.credentials && data.credentials.token}`;
                                _this.setState({user: data.credentials, ventureId: hash(data.credentials.userId)});

                                   AsyncStorage.setItem('@AsyncStorage:Venture:currentUser:friendsAPICallURL', api)
                                    .then(() => {
                                       _this._updateUserLoginStatus(true);
                                    })
                                    .catch(error => console.log(error.message))
                                    .done();

                                  AsyncStorage.setItem('@AsyncStorage:Venture:isOnline', 'true')
                                    .then(() => console.log('Logged in!'))
                                    .catch((error) => console.log(error.message))
                                    .done();
                        }}
                                    />
                            </Image>
                        </View>
                        <View style={styles.slide}>
                            <Image
                                resizeMode={Image.resizeMode.stretch}
                                source={require('./../img/OnboardingWhatDoYouWantToDo.png')}
                                style={styles.backdrop}>
                            </Image>
                        </View>
                        <View style={styles.slide}>
                            <Image
                                resizeMode={Image.resizeMode.stretch}
                                source={require('./../img/OnboardingFindActivityPartners.png')}
                                style={styles.backdrop}>
                            </Image>
                        </View>
                        <View style={styles.slide}>
                            <Image
                                resizeMode={Image.resizeMode.stretch}
                                source={require('./../img/OnboardingShareActivities.png')}
                                style={styles.backdrop}>
                            </Image>
                        </View>
                        <View style={styles.slide}>
                            <Image
                                resizeMode={Image.resizeMode.stretch}
                                source={require('./../img/OnboardingMakeNewConnections.png')}
                                style={styles.backdrop}>
                            </Image>
                        </View>
                    </Swiper>
                    </Image>
            </View>
        )
    }
});

var styles = StyleSheet.create({
    wrapper: {
        // backgroundColor: '#f00',
    },
    slide: {
        flex: 1,
        backgroundColor: 'transparent'
    },
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        width: null,
        height: null
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
        height: 122.62,
        backgroundColor: 'transparent'
    },
});

module.exports = Login;