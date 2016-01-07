/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Home
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    AppStateIOS,
    AsyncStorage,
    DatePickerIOS,
    Image,
    InteractionManager,
    LayoutAnimation,
    PixelRatio,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    View
    } = React;

var _ = require('lodash');
var CheckBoxIcon = require('../Partials/Icons/CheckBoxIcon');
var ChevronIcon = require('../Partials/Icons/ChevronIcon');
var ClockIcon = require('../Partials/Icons/ClockIcon');
var Dimensions = require('Dimensions');
var TimerMixin = require('react-timer-mixin');

var ADD_INFO_BUTTON_SIZE = 28;
var ACTIVITY_TEXT_INPUT_PADDING = 5;
var ACTIVITY_TITLE_INPUT_REF = 'activityTitleInput'
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var MAX_TEXT_INPUT_VAL_LENGTH = 15;
var NEXT_BUTTON_SIZE = 28;
var SCREEN_HEIGHT = Dimensions.get('window').height;
var SCREEN_WIDTH = Dimensions.get('window').width;
var TAG_SELECTION_INPUT_REF = 'tagSelectionInput';
var TAG_TEXT_INPUT_PADDING = 3;

var Home = React.createClass({
    statics: {
        title: '<Home>',
        description: 'Main screen - activity selection.'
    },

    mixins: [TimerMixin],

    getInitialState() {
        var Firebase = require('firebase');

        return {
            activeTimeOption: 'now',
            activityTitleInput: '',
            contentOffsetXVal: 0,
            currentAppState: AppStateIOS.currentState,
            currentUserLocationCoords: null,
            date: new Date(),
            events: [],
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            hasIshSelected: false,
            hasKeyboardSpace: false,
            hasSpecifiedTime: false,
            isLoggedIn: false,
            ready: false,
            showAddInfoBox: false,
            showAddInfoButton: true,
            showNextButton: false,
            showTextInput: false,
            showTimeSpecificationOptions: false,
            showTrendingItems: false,
            tagsArr: [],
            tagInput: '',
            timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60,
            trendingContent: 'YALIES',
            trendingContentOffsetXVal: 0,
            ventureId: '',
            viewStyle: {
                marginHorizontal: 0,
                borderRadius: 0
            },
            yalies: []
        }
    },

    componentWillMount() {
        //@hmm: wait for async storage account to update on login
        InteractionManager.runAfterInteractions(() => {
            this.setTimeout(() => {
                AsyncStorage.getItem('@AsyncStorage:Venture:account')
                    .then((account:string) => {
                        account = JSON.parse(account);

                        if (account === null) {
                            this.setTimeout(this._safelyNavigateToLogin, 200)
                            return;
                        }

                        this.setState({isLoggedIn: true, showTextInput: true});

                        let currentUserRef = this.state.firebaseRef && this.state.firebaseRef.child(`users/${account.ventureId}`),
                            trendingItemsRef = this.state.firebaseRef && this.state.firebaseRef.child('trending'),
                            usersListRef = this.state.firebaseRef && this.state.firebaseRef.child('users'),
                            chatRoomsRef = this.state.firebaseRef && this.state.firebaseRef.child('chat_rooms'),
                            _this = this;

                        trendingItemsRef.once('value', snapshot => {
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                                _this.setState({
                                    currentUserRef,
                                    events: snapshot.val() && snapshot.val().events && _.slice(snapshot.val().events, 0, 1),
                                    yalies: snapshot.val() && snapshot.val().yalies  && _.slice(snapshot.val().yalies, 0, 3),
                                    showTrendingItems: true
                                })
                            }
                        );

                        //@hmm: get current user location & save to firebase object
                        // make sure this fires before navigating away!

                        navigator.geolocation.getCurrentPosition(
                            (currentPosition) => {
                                currentUserRef.child(`location/coordinates`).set(currentPosition.coords);
                                this.setState({currentUserLocationCoords: [currentPosition.coords.latitude, currentPosition.coords.longitude]});
                            },
                            (error) => {
                                console.error(error);
                            },
                            {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
                        );

                        chatRoomsRef.once('value', snapshot => {
                            snapshot.val() && _.each(snapshot.val(), (chatRoom) => {
                                if (chatRoom._id && chatRoom._id.indexOf(account.ventureId) > -1) {
                                    chatRoomsRef.child(chatRoom._id).set(null);
                                }
                            });
                        });

                        // @hmm: at restart reset all timer vals & chats

                        currentUserRef.child('match_requests').once('value', snapshot => {
                            snapshot.val() && _.each(snapshot.val(), (match) => {
                                if (match && match.timerVal) {
                                    currentUserRef.child(`match_requests/${match._id}/timerVal`).set(null);
                                    usersListRef.child(`${match._id}/match_requests/${account.ventureId}/timerVal`).set(null);
                                    usersListRef.child(`${match._id}/chatCount`).once('value', snapshot => {
                                        usersListRef.child(`${match._id}/chatCount`).set(snapshot.val() - 1);
                                    });

                                }
                            });
                            currentUserRef.child('chatCount').set(0);
                        });

                        // @hmm: at restart reset all event invite matches & chats

                        currentUserRef.child('event_invite_match_requests').once('value', snapshot => {
                            snapshot.val() && _.each(snapshot.val(), (match) => {
                                if (match && match.timerVal) {
                                    currentUserRef.child(`event_invite_match_requests/${match._id}/timerVal`).set(null);
                                    usersListRef.child(`${match._id}/event_invite_match_requests/${account.ventureId}/timerVal`).set(null);
                                    usersListRef.child(`${match._id}/chatCount`).once('value', snapshot => {
                                        usersListRef.child(`${match._id}/chatCount`).set(snapshot.val() - 1);
                                    });

                                }
                            });
                        });

                        this.setState({ventureId: account.ventureId});

                        AppStateIOS.addEventListener('change', this._handleAppStateChange);

                    })
                    .catch((error) => console.log(error.message))
                    .done();
            }, 0); //@hmm: this time has to be less than time spent on home page
        });
    },

    componentDidMount(){
        if(this.state.currentUserLocationCoords === null) {
            navigator.geolocation.getCurrentPosition(
                (currentPosition) => {
                    this.setState({currentUserLocationCoords: [currentPosition.coords.latitude, currentPosition.coords.longitude]});
                },
                (error) => {
                    console.error(error);
                },
                {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
            );
        }

        AsyncStorage.getItem('@AsyncStorage:Venture:currentUser:friendsAPICallURL')
            .then((friendsAPICallURL) => friendsAPICallURL)
            .then((friendsAPICallURL) => {
                AsyncStorage.getItem('@AsyncStorage:Venture:currentUserFriends')
                    .then((currentUserFriends) => {

                        currentUserFriends = JSON.parse(currentUserFriends);

                        if(currentUserFriends) this.setState({currentUserFriends});

                        else {
                            AsyncStorage.getItem('@AsyncStorage:Venture:isOnline')
                                .then((isOnline) => {
                                    if(isOnline === 'true') {
                                        fetch(friendsAPICallURL)
                                            .then(response => response.json())
                                            .then(responseData => {

                                                AsyncStorage.setItem('@AsyncStorage:Venture:currentUserFriends', JSON.stringify(responseData.data))
                                                    .catch(error => console.log(error.message))
                                                    .done();

                                                this.setState({currentUserFriends: responseData.data});
                                            })
                                            .done();
                                    }
                                })
                                .done()
                        }
                    })
                    .catch(error => console.log(error.message))
                    .done();
            })
            .catch(error => console.log(error.message))
            .done();
    },

    componentWillUnmount() {
        AppStateIOS.removeEventListener('change', this._handleAppStateChange);
    },

    animateViewLayout(text:string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({
            viewStyle: {
                marginHorizontal: text.length ? SCREEN_WIDTH / 12 : null,
                borderRadius: text.length ? 10 : 0
            }
        });
    },

    _createTrendingItem(type, uri, i) {
        if(type === 'user') return (
            <TouchableOpacity key={i} style={styles.trendingItem}>
                <Image
                    defaultSource={require('./../img/HomeBackground.png')}
                    style={styles.trendingUserImg}
                    source={{uri}}/>
            </TouchableOpacity>
        )

        let MainLayout = require('../Layouts/MainLayout');

        return (
            <TouchableOpacity key={i} onPress={() => {
                    this._safelyNavigateForward({title: 'Events', component: MainLayout, passProps: {currentUserFriends: this.state.currentUserFriends, currentUserLocationCoords: this.state.currentUserLocationCoords, firebaseRef: this.state.firebaseRef, selected: 'events', ventureId: this.state.ventureId}});
            }} style={styles.trendingItem}>
                <Image style={styles.trendingEventImg} source={{uri}}/>
            </TouchableOpacity>
        )

    },

    _createTag(tag:string) {
        return (
            <TouchableOpacity onPress={() => {
                            this.setState({tagsArr: _.remove(this.state.tagsArr,
                                (tagVal) => {
                                return tagVal !== tag;
                                }
                            )});
                        }} style={styles.tag}><Text
                style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
        )
    },

    _getTimeString(date) {
        var t = date.toLocaleTimeString();
        t = t.replace(/\u200E/g, '');
        t = t.replace(/^([^\d]*\d{1,2}:\d{1,2}):\d{1,2}([^\d]*)$/, '$1$2');
        // @hmm: get rid of time zone
        t = t.substr(0, t.length - 4);

        if (this.state.hasIshSelected) return t.split(' ')[0] + '-ish ' + t.split(' ')[1]; // e.g. 9:10ish PM
        return t;
    },


    _handleAppStateChange(currentAppState) {
        let previousAppState = this.state.currentAppState;

        this.setState({currentAppState, previousAppState});

        if(previousAppState === 'background' && currentAppState === 'active') {
            navigator.geolocation.getCurrentPosition(
                (currentPosition) => {
                    this.state.currentUserRef && this.state.currentUserRef.child(`location/coordinates`).set(currentPosition.coords);
                    this.setState({currentUserLocationCoords: [currentPosition.coords.latitude, currentPosition.coords.longitude]});
                },
                (error) => {
                    console.error(error);
                },
                {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
            );
        }
    },

    _onBlur() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({hasKeyboardSpace: false, showAddInfoButton: true, showNextButton: !!this.state.activityTitleInput, showTextInput: true});
    },

    onDateChange(date): void {
        this.setState({date: date});
    },

    _onFocus() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
        this.setState({hasKeyboardSpace: true, showAddInfoButton: false, showNextButton: false, showTextInput: false});
    },

    onSubmitActivity() {
        let activityTitleInputWithoutPunctuation = (this.state.activityTitleInput).replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' '),
            activityPreferenceChange = {
                title: activityTitleInputWithoutPunctuation + '?',
                tags: this.state.tagsArr,
                status: this.state.activeTimeOption.toUpperCase(),
                start: {
                    time: (this.state.activeTimeOption === 'specify' ? this._getTimeString(this.state.date) : ''),
                    dateTime: this.state.date,
                    timeZoneOffsetInHours: this.state.timeZoneOffsetInHours
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            firebaseRef = this.state.firebaseRef;

        // @hmm: have to manually blur the text input,
        // since were not using navigator.push()

        let MainLayout = require('../Layouts/MainLayout');

        firebaseRef.child(`users/${this.state.ventureId}/activityPreference`).set(activityPreferenceChange);
        this._safelyNavigateForward({title: 'Users', component: MainLayout, passProps: {currentUserFriends: this.state.currentUserFriends, currentUserLocationCoords: this.state.currentUserLocationCoords, firebaseRef: this.state.firebaseRef, selected: 'users', ventureId: this.state.ventureId}});

        this.refs[ACTIVITY_TITLE_INPUT_REF].blur();
    },

    _roundDateDownToNearestXMinutes(date, num) {
        var coeff = 1000 * 60 * num;
        return new Date(Math.floor(date.getTime() / coeff) * coeff);
    },

    _safelyNavigateForward(route:{title:string, component:ReactClass<any,any,any>, passProps?:Object}) {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
            layoutItemRoute = _.findWhere(currentRouteStack, {title: 'Users'}) || _.findWhere(currentRouteStack, {title: 'Chats'}) || _.findWhere(currentRouteStack, {title: 'Events'}) || _.findWhere(currentRouteStack, {title: 'Hot'}) || _.findWhere(currentRouteStack, {title: 'Profile'});

        if(layoutItemRoute) {
            // alert('already there')
            let idx = currentRouteStack.indexOf(layoutItemRoute);
            this.props.navigator.replaceAtIndex(route, idx, () => {
                this.props.navigator.jumpTo(route);
            })
        } else {
            // alert('push a new route ' + JSON.stringify(route))
            currentRouteStack.push(route);
            this.props.navigator.immediatelyResetRouteStack(currentRouteStack)
        }
    },

    _safelyNavigateToLogin() {
        var Login = require('../Pages/Login');

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        this.props.navigator.immediatelyResetRouteStack([{title: 'Login', component: Login}]);
    },

    render() {
        var { Icon, } = require('react-native-icons');

        let content,
            isAtScrollViewStart = this.state.contentOffsetXVal === 0,
            isAtTrendingScrollViewStart = this.state.trendingContentOffsetXVal === 0,
            tagSelection;

        let activityTitleInput = (
            <TextInput
                ref={ACTIVITY_TITLE_INPUT_REF}
                autoCapitalize='none'
                autoCorrect={false}
                maxLength={15}
                onChangeText={(text) => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        if(!text) this.setState({showTimeSpecificationOptions: false});
                        this.setState({activityTitleInput: text.toUpperCase(), showNextButton: !!text});
                        this.animateViewLayout(text);
                    }}
                placeholder={'What do you want to do?'}
                placeholderTextColor={'rgba(255,255,255,1.0)'}
                returnKeyType='done'
                style={[styles.activityTitleInput, this.state.viewStyle, {marginTop: SCREEN_HEIGHT/3}]}
                value={this.state.activityTitleInput}/>
        );

        let addInfoButton = (
            <View style={[styles.addInfoButtonContainer, {bottom: (this.state.showNextButton && this.state.showAddInfoBox ? SCREEN_HEIGHT/20 : SCREEN_HEIGHT/32 )}]}>
                <TouchableOpacity
                    activeOpacity={0.4}
                    onPress={() => {
                            this.refs[ACTIVITY_TITLE_INPUT_REF].blur();
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({activeTimeOption: 'now', date: new Date(), showAddInfoBox: !this.state.showAddInfoBox, tagInput: '', tags: []})
                        }}>
                    <Icon
                        name={this.state.showAddInfoBox ? 'ion|chevron-up' : 'ion|ios-plus'}
                        size={ADD_INFO_BUTTON_SIZE}
                        color='#fff'
                        style={{width: ADD_INFO_BUTTON_SIZE, height: ADD_INFO_BUTTON_SIZE}}
                        />
                </TouchableOpacity>
            </View>
        );

        let nextButton = (
            <View style={styles.nextButtonContainer}>
                <TouchableOpacity
                    activeOpacity={0.4}
                    onPress={this.onSubmitActivity}>
                    <Icon
                        name='ion|arrow-right-b'
                        size={NEXT_BUTTON_SIZE}
                        color='#fff'
                        style={{width: NEXT_BUTTON_SIZE, height: NEXT_BUTTON_SIZE}}
                        />
                </TouchableOpacity>
            </View>
        );

        let trendingItemsCarousel = (
            <View style={styles.trendingItemsCarousel}>
                <Title>TRENDING <Text style={{color: '#ee964b'}}>{this.state.trendingContent}</Text></Title>
                <ScrollView
                    automaticallyAdjustContentInsets={false}
                    canCancelContentTouches={false}
                    contentOffset={{x: this.state.trendingContentOffsetXVal, y: 0}}
                    horizontal={true}
                    directionalLockEnabled={true}
                    showsHorizontalScrollIndicator={true}
                    style={[styles.scrollView, styles.horizontalScrollView, {marginTop: 10}]}>
                    {this.state.yalies && this.state.yalies.map(this._createTrendingItem.bind(null, 'user'))}
                    {this.state.events && this.state.events.map(this._createTrendingItem.bind(null, 'event'))}
                </ScrollView>
                <View style={[styles.scrollbarArrow, {bottom: SCREEN_HEIGHT / 22}, (isAtTrendingScrollViewStart ? {right: 5} : {left: 5})]}>
                    <ChevronIcon
                        color='rgba(255,255,255,0.8)'
                        size={20}
                        direction={isAtTrendingScrollViewStart ? 'right' : 'left'}
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({trendingContentOffsetXVal: (isAtTrendingScrollViewStart ? SCREEN_WIDTH / 1.31 : 0), trendingContent: (isAtTrendingScrollViewStart ? 'EVENTS' : 'YALIES')})
                            }}/>
                </View>
            </View>
        );

        if (this.state.showTimeSpecificationOptions)
            content = (
                <View style={styles.timeSpecificationOptions}>
                    <DatePickerIOS
                        date={this.state.date}
                        mode="time"
                        timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
                        onDateChange={this.onDateChange}
                        minuteInterval={5}
                        style={styles.timeSpecificationDatePicker}/>
                    <View style={styles.timeSpecificationButtons}>
                        <ClockIcon
                            active={false}
                            caption='Done'
                            captionStyle={{color: '#fff'}}
                            onPress={() => this.setState({showTimeSpecificationOptions: false})}/>
                        <CheckBoxIcon
                            active={this.state.hasIshSelected}
                            caption='-ish'
                            captionStyle={{color: '#fff'}}
                            onPress={() => this.setState({hasIshSelected: !this.state.hasIshSelected})}/>
                    </View>

                </View>
            );
        else
            content = (
                <View style={styles.addTimeInfoContainer}>
                    <ScrollView
                        automaticallyAdjustContentInsets={false}
                        canCancelContentTouches={false}
                        centerContent={true}
                        contentContainerStyle={{flex: 1, flexDirection: 'row', width: SCREEN_WIDTH * 1.18, alignItems: 'center'}}
                        contentOffset={{x: this.state.contentOffsetXVal, y: 0}}
                        decelerationRate={0.7}
                        horizontal={true}
                        directionalLockEnabled={true}
                        style={[styles.scrollView, styles.horizontalScrollView, {paddingTop: 10}]}>
                        <CheckBoxIcon
                            active={this.state.activeTimeOption === 'now'}
                            caption='now'
                            captionStyle={styles.captionStyle}
                            color='#7cff9d'
                            onPress={() => this.setState({activeTimeOption: 'now', hasSpecifiedTime: false})}/>
                        <CheckBoxIcon
                            active={this.state.activeTimeOption === 'later'}
                            caption='later'
                            captionStyle={styles.captionStyle}
                            color='#ffd65c'
                            onPress={() => this.setState({activeTimeOption: 'later', hasSpecifiedTime: false})}/>
                        <ClockIcon
                            active={this.state.activeTimeOption === 'specify'}
                            caption={this.state.hasSpecifiedTime ? this._getTimeString(this._roundDateDownToNearestXMinutes(this.state.date, 5)) : 'specify'}
                            captionStyle={styles.captionStyle}
                            onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            if(this.state.activeTimeOption === 'specify') this.setState({hasSpecifiedTime: true, showTimeSpecificationOptions: true});
                            else this.setState({activeTimeOption: 'specify'})
                        }}/>
                    </ScrollView>
                    <View style={[styles.scrollbarArrow, (isAtScrollViewStart ? {right: 10} : {left: 10})]}>
                        <ChevronIcon
                            size={20}
                            direction={isAtScrollViewStart ? 'right' : 'left'}
                            onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({contentOffsetXVal: (isAtScrollViewStart ? SCREEN_WIDTH/2.65 : 0)})
                            }}/>
                    </View>
                </View>
            );

        tagSelection = (
            <View style={styles.tagSelection}>
                <TextInput
                    ref={TAG_SELECTION_INPUT_REF}
                    onFocus={this._onFocus}
                    onBlur={this._onBlur}
                    autoCapitalize='none'
                    autoCorrect={false}
                    maxLength={MAX_TEXT_INPUT_VAL_LENGTH}
                    onChangeText={(text) => {
                        // @hmm: make sure emojis don't cause error - each emoji counts for 3 characters
                        if(!text.match(/^[a-zA-Z]+$/) && text.length >= MAX_TEXT_INPUT_VAL_LENGTH - 1) return;
                        this.setState({tagInput: text});
                    }}
                    onSubmitEditing={() => {
                        let tagsArr = this.state.tagsArr,
                            text = this.state.tagInput;

                        //@hmm: check that tag isn't already present and that max num of tags is 5
                        if(tagsArr.indexOf(text) < 0 && tagsArr.length <= 5) {
                        tagsArr.push(text);
                        }
                        this.setState({tagsArr, tagInput: ''});
                    }}
                    placeholder={'Type a tag and submit. Tap to delete.'}
                    placeholderTextColor={'rgba(0,0,0,0.8)'}
                    returnKeyType='done'
                    style={styles.tagsInputText}
                    value={this.state.tagInput}/>
                <ScrollView
                    automaticallyAdjustContentInsets={false}
                    centerContent={true}
                    horizontal={true}
                    directionalLockEnabled={true}
                    showsHorizontalScrollIndicator={true}
                    style={[styles.scrollView, {height: 20}]}>
                    {this.state.tagsArr.map(this._createTag)}
                </ScrollView>
            </View>
        );

        // @hmm keep addInfoBox down here after assigning content and tagSelection
        let addInfoBox = (
            <View
                style={[styles.addInfoBox, {bottom: (this.state.hasKeyboardSpace ? SCREEN_HEIGHT/3 : SCREEN_HEIGHT / 35)}]}>
                <View style={{top: 5}}><Title>WHEN?</Title></View>
                {content}
                {tagSelection}
            </View>
        );

        var ChatsListPageIcon = require('../Partials/Icons/ChatsListPageIcon');
        var Header = require('../Partials/Header');
        var Logo = require('../Partials/Logo');
        let MainLayout = require('../Layouts/MainLayout');
        var ProfilePageIcon = require('../Partials/Icons/ProfilePageIcon');

        return (
            <View style={styles.container}>
                <Image
                    onLoad={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({ready: true})
                    }}
                    source={require('./../img/HomeBackground.png')}
                    style={styles.backdrop}>
                {this.state.isLoggedIn && this.state.ready ?
                <View>
                    <Header>
                        <ProfilePageIcon style={{opacity: 0.4, bottom: SCREEN_HEIGHT/34, right: 20}}
                                         onPress={() => {
                                            if(!this.state.hasKeyboardSpace) this._safelyNavigateForward({title: 'Profile', component: MainLayout, passProps: {currentUserFriends: this.state.currentUserFriends, currentUserLocationCoords: this.state.currentUserLocationCoords, firebaseRef: this.state.firebaseRef, selected: 'profile', ventureId: this.state.ventureId}});
                                         }} />
                        <ChatsListPageIcon style={{opacity: 0.4, bottom: SCREEN_HEIGHT/34, left: 20}}
                                           onPress={() => {
                                            if(!this.state.hasKeyboardSpace) this._safelyNavigateForward({title: 'Chats', component: MainLayout, passProps: {currentUserFriends: this.state.currentUserFriends, currentUserLocationCoords: this.state.currentUserLocationCoords, firebaseRef: this.state.firebaseRef, selected: 'chats', ventureId: this.state.ventureId}});
                                           }} />
                    </Header>
                    <Logo
                        logoContainerStyle={styles.logoContainerStyle}
                        logoStyle={styles.logoStyle}/>
                    {this.state.showTextInput ? activityTitleInput : <View />}
                    {this.state.showNextButton ? nextButton : <View />}
                    {this.state.showAddInfoButton && !this.state.showTimeSpecificationOptions && this.state.activityTitleInput ? addInfoButton : <View />}
                </View>
            : <View />}
                    {this.state.showAddInfoBox && this.state.activityTitleInput && this.state.isLoggedIn && this.state.ready ? addInfoBox : <View/>}
                    {this.state.showTrendingItems && !this.state.showAddInfoBox && this.state.isLoggedIn && this.state.ready ? trendingItemsCarousel : <View/>}
                </Image>
            </View>
        );
    }
});

class Title extends React.Component {
    render() {
        return (
            <Text
                style={[styles.title, {fontSize: this.props.fontSize}, this.props.titleStyle]}>{this.props.children}</Text>
        );
    }
}

var styles = StyleSheet.create({
    activitySelection: {
        height: SCREEN_HEIGHT / 15
    },
    activityTitleInput: {
        height: 52,
        textAlign: 'center',
        fontSize: SCREEN_HEIGHT / 23,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fontFamily: 'AvenirNextCondensed-UltraLight'
    },
    addInfoBox: {
        position: 'absolute',
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        padding: 2
    },
    addInfoButton: {
    },
    addInfoButtonContainer: {
        backgroundColor: 'transparent',
        flexDirection: 'row',
        justifyContent: 'center',
        width: SCREEN_WIDTH,
        marginTop: SCREEN_HEIGHT / 40
    },
    addTimeInfoContainer: {},
    backdrop: {
        flex: 1,
        paddingTop: 10,
        alignItems: 'center',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    captionStyle: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    horizontalScrollView: {
        height: 85
    },
    logoContainerStyle: {
        backgroundColor: 'transparent',
        position: 'absolute',
        top: SCREEN_HEIGHT / 6,
        marginHorizontal: (SCREEN_WIDTH - LOGO_WIDTH) / 2
    },
    logoStyle: {
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT
    },
    nextButtonContainer: {
        bottom: 40,
        right: 60,
        alignSelf: 'flex-end'
    },
    scrollbarArrow: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT / 58
    },
    scrollView: {
        backgroundColor: 'rgba(0,0,0,0.008)'
    },
    timeSpecificationOptions: {
        flex: 1,
        flexDirection: 'column'
    },
    timeSpecificationButtons: {
        top: 20,
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    title: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular',
        fontSize: 20,
        textAlign: 'center',
        paddingTop: 5
    },
    tag: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: SCREEN_WIDTH / 10,
        paddingHorizontal: SCREEN_WIDTH / 80,
        marginHorizontal: SCREEN_WIDTH / 70,
        paddingVertical: SCREEN_WIDTH / 300,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.4)',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        top: SCREEN_WIDTH / 90,
        height: SCREEN_WIDTH / 15
    },
    tagsInputText: {
        top: 5,
        borderWidth: 0.5,
        borderColor: '#0f0f0f',
        backgroundColor: 'rgba(255,255,255,0.4)',
        flex: 1,
        padding: TAG_TEXT_INPUT_PADDING,
        height: SCREEN_HEIGHT / 158,
        fontSize: SCREEN_HEIGHT / 52,
        color: '#000',
        textAlign: 'center',
        fontFamily: 'AvenirNextCondensed-Regular',
        borderRadius: 5,
        bottom: 8
    },
    tagSelection: {
        marginTop: 8,
        height: SCREEN_HEIGHT / 6.6,
        paddingTop: 19,
        paddingHorizontal: 25,
        bottom: 5
    },
    timeSpecificationDatePicker: {
        top: 10,
        height: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)'
    },
    tagText: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    trendingItems: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    trendingItem: {
        borderRadius: 3,
        marginHorizontal: SCREEN_WIDTH / 29.9
    },
    trendingItemsCarousel: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT / 35,
        width: SCREEN_WIDTH / 1.18,
        alignSelf: 'center',
        justifyContent: 'center',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10
    },
    trendingUserImg: {
        width: SCREEN_WIDTH / 5.3,
        height: 64,
        resizeMode: 'contain'
    },
    trendingEventImg: {
        width: SCREEN_WIDTH / 1.34,
        height: 64,
        resizeMode: 'contain'
    }
});


module.exports = Home;