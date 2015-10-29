/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule ChatsList
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    ActivityIndicatorIOS,
    AsyncStorage,
    Image,
    InteractionManager,
    LayoutAnimation,
    ListView,
    Navigator,
    StyleSheet,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    View
    } = React;

var _ = require('lodash');
var AwaitingResponseIcon = require('../../Partials/Icons/AwaitingResponseIcon');
var Chat = require('../Chat');
var ChevronIcon = require('../../Partials/Icons/ChevronIcon');
var Display = require('react-native-device-display');
var FilterModalIcon = require('../../Partials/Icons/FilterModalIcon');
var Filters = require('../Filters');
var Firebase = require('firebase');
var GeoFire = require('geofire');
var Header = require('../../Partials/Header');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var LinearGradient = require('react-native-linear-gradient');
var Logo = require('../../Partials/Logo');
var MatchedIcon = require('../../Partials/Icons/MatchedIcon');
var Modal = require('react-native-swipeable-modal');
var ReactFireMixin = require('reactfire');
var ReceivedResponseIcon = require('../../Partials/Icons/ReceivedResponseIcon');
var Swipeout = require('react-native-swipeout');

var EVENT_ID = 'e068e2d69f2b6b69acf181b6889f9db5934901c2b38fe9947850ed4bb033736f';
var EVENT_TITLE = 'YSO Halloween Show';
var INITIAL_LIST_SIZE = 8;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var PAGE_SIZE = 10;
var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;
var THUMBNAIL_SIZE = 50;

var YELLOW_HEX_CODE = '#ffe770';
var BLUE_HEX_CODE = '#40cbfb';
var GREEN_HEX_CODE = '#84FF9B';
var WHITE_HEX_CODE = '#fff';

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};

var User = React.createClass({
    propTypes: {
        currentUserLocationCoords: React.PropTypes.array,
        currentUserData: React.PropTypes.object,
        data: React.PropTypes.object,
        navigator: React.PropTypes.object
    },

    getInitialState() {
        return {
            dir: 'row',
            status: '',
            timerVal: '',
        }
    },

    componentWillMount() {
        let distance = this.props.data && this.props.data.location && this.props.data.location.coordinates && this.calculateDistance(this.props.currentUserLocationCoords, [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]),
            _this = this;

        if(this.props.data && this.props.data.isEventInvite) {
            this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
            && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`).child(this.props.data.ventureId).off();

            this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`).child(this.props.data.ventureId)
            && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`).child(this.props.data.ventureId).on('value', snapshot => {
                _this.setState({
                    distance,
                    status: snapshot.val() && snapshot.val().status,
                    timerVal: snapshot.val() && snapshot.val().timerVal && this._getTimerValue(snapshot.val().timerVal)
                });
            });
        } else {
            this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
            && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).off();

            this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
            && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).on('value', snapshot => {
                _this.setState({
                    distance,
                    status: snapshot.val() && snapshot.val().status,
                    timerVal: snapshot.val() && snapshot.val().timerVal && this._getTimerValue(snapshot.val().timerVal)
                });
            });
        }
    },

    componentWillReceiveProps(nextProps) {
        let distance = nextProps.data && nextProps.data.location && nextProps.data.location.coordinates && this.calculateDistance(nextProps.currentUserLocationCoords, [nextProps.data.location.coordinates.latitude, nextProps.data.location.coordinates.longitude]),
            _this = this;

        if(nextProps.data && nextProps.data.isEventInvite) {
            nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId)
            && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/event_invite_match_requests`).child(nextProps.data.ventureId).off();


            nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/event_invite_match_requests`).child(nextProps.data.ventureId)
            && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/event_invite_match_requests`).child(nextProps.data.ventureId).on('value', snapshot => {
                _this.setState({status: ''})
                _this.setState({
                    distance,
                    status: snapshot.val() && snapshot.val().status,
                    timerVal: snapshot.val() && snapshot.val().timerVal && this._getTimerValue(snapshot.val().timerVal)
                });
            });
        } else {
            nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId)
            && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId).off();


            nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId)
            && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId).on('value', snapshot => {
                _this.setState({status: ''})
                _this.setState({
                    distance,
                    status: snapshot.val() && snapshot.val().status,
                    timerVal: snapshot.val() && snapshot.val().timerVal && this._getTimerValue(snapshot.val().timerVal)
                });
            });
        }
    },


    componentWillUnmount() {
        let currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/match_requests');

        if(this.props.data && this.props.data.isEventData) currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/event_invite_match_requests');

        currentUserMatchRequestsRef && currentUserMatchRequestsRef.off();
    },

    calculateDistance(location1:Array, location2:Array) {
        return location1 && location2 && (GeoFire.distance(location1, location2) * 0.621371).toFixed(1);
    },

    _getSecondaryStatusColor() {
        switch (this.state.status) {
            case 'sent':
                return '#FFF9B9';
            case 'received':
                return '#D1F8FF';
            case 'matched':
                return '#AAFFA9';
            default:
                return '#FBFBF1';
        }
    },

    getStatusColor() {
        switch (this.state.status) {
            case 'sent':
                return YELLOW_HEX_CODE;
            case 'received':
                return BLUE_HEX_CODE;
            case 'matched':
                return GREEN_HEX_CODE;
            default:
                return WHITE_HEX_CODE;
        }
    },

    _getTimerValue(numOfMilliseconds:number) {
        var date = new Date(numOfMilliseconds);
        return date.getMinutes() + 'm ' + date.getSeconds() + 's';
    },

    handleMatchInteraction() {
        // @hmm: use hashed targetUserID as key for data for user in list
        if(this.props.data && this.props.data.isEventInvite) {

            let targetUserIDHashed = this.props.data.ventureId,
                currentUserIDHashed = this.props.currentUserIDHashed,
                firebaseRef = this.props.firebaseRef,
                targetUserEventInviteMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/event_invite_match_requests'),
                currentUserEventInviteMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/event_invite_match_requests'),
                _this = this;

            if (this.state.status === 'sent') {

                // @hmm: delete the request

                targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).set(null);
                currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).set(null);
            }

            else if (this.state.status === 'received') {

                // @hmm: accept the request
                // chatroom reference uses id of the user who accepts the received matchInteraction

                targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
                    account: this.props.currentUserData && _.assign(_.pick(this.props.currentUserData, 'firstName', 'picture', 'ventureId', 'bio', 'ageRange', 'location'), {isEventInvite: true}),
                    eventId: EVENT_ID,
                    eventTitle: EVENT_TITLE,
                    status: 'matched',
                    role: 'recipient'
                }, 100);

                currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                    account: this.props.data && _.assign(_.pick(this.props.data, 'firstName', 'picture', 'ventureId', 'bio', 'ageRange', 'location'), {isEventInvite: true}),
                    eventId: EVENT_ID,
                    eventTitle: EVENT_TITLE,
                    status: 'matched',
                    role: 'sender'
                }, 100);
            }

            else if (this.state.status === 'matched') {
                let chatRoomEventTitle = EVENT_TITLE,
                    distance = this.state.distance + ' mi',
                    _id;

                currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).once('value', snapshot => {

                    if (snapshot.val() && snapshot.val().role === 'sender') {
                        _id = 'EVENT_INVITE_' + targetUserIDHashed + '_TO_' + currentUserIDHashed;
                    } else {
                        _id = 'EVENT_INVITE_' + currentUserIDHashed + '_TO_' + targetUserIDHashed;
                    }

                    firebaseRef.child(`chat_rooms/${_id}`).once('value', snapshot => {

                        let chatRoomRef = firebaseRef.child(`chat_rooms/${_id}`),
                            currentRouteStack = this.props.navigator.getCurrentRoutes(),
                            chatRoomRoute = _.findWhere(currentRouteStack, {title: 'Chat', passProps: {_id}});

                        if (snapshot.val() === null) {

                            chatRoomRef.child('_id').set(_id); // @hmm: set unique chat Id
                            chatRoomRef.child('timer').set({value: 300000}); // @hmm: set timer
                            chatRoomRef.child('user_activity_preference_titles').child(currentUserIDHashed).set(EVENT_TITLE);
                            chatRoomRef.child('user_activity_preference_titles').child(targetUserIDHashed).set(EVENT_TITLE);

                        }

                        firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).once('value', snapshot => {
                            if (snapshot.val() === 0) {
                                _this.props.navigator.push({
                                    title: 'Chat',
                                    component: Chat,
                                    passProps: {
                                        _id,
                                        recipient: _this.props.data,
                                        distance,
                                        chatRoomEventTitle,
                                        chatRoomRef,
                                        currentUserData: _this.props.currentUserData
                                    }
                                });
                            }
                            else if (chatRoomRoute) _this.props.navigator.jumpTo(chatRoomRoute);
                            else {
                                currentRouteStack.push({
                                    title: 'Chat',
                                    component: Chat,
                                    passProps: {
                                        _id,
                                        recipient: _this.props.data,
                                        distance,
                                        chatRoomEventTitle,
                                        chatRoomRef,
                                        currentUserData: _this.props.currentUserData
                                    }
                                });
                                _this.props.navigator.immediatelyResetRouteStack(currentRouteStack);
                            }
                        });
                    })
                });
            }

            else {
                targetUserEventInviteMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
                    account: this.props.currentUserData && _.assign(_.pick(this.props.currentUserData, 'name', 'picture', 'ventureId', 'bio', 'ageRange', 'location'), {isEventInvite: true}),
                    eventId: EVENT_ID,
                    eventTitle: EVENT_TITLE,
                    status: 'received'
                }, 200);
                currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                    account: this.props.data && _.assign(_.pick(this.props.data, 'name', 'picture', 'ventureId', 'bio', 'ageRange', 'location'), {isEventInvite: true}),
                    eventId: EVENT_ID,
                    eventTitle: EVENT_TITLE,
                    status: 'sent'
                }, 300);
            }
        } else {


            let targetUserIDHashed = this.props.data.ventureId,
                currentUserIDHashed = this.props.currentUserIDHashed,
                firebaseRef = this.props.firebaseRef,
                targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests'),
                currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
                _this = this;

            if (this.state.status === 'sent') {

                // @hmm: delete the request

                targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
                currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);
            }

            else if (this.state.status === 'received') {

                // @hmm: accept the request
                // chatroom reference uses id of the user who accepts the received matchInteraction

                targetUserMatchRequestsRef.child(currentUserIDHashed).set({
                    status: 'matched',
                    role: 'recipient'
                });

                currentUserMatchRequestsRef.child(targetUserIDHashed).set({
                    status: 'matched',
                    role: 'sender'
                });
            }

            else if (this.state.status === 'matched') {
                let chatRoomActivityPreferenceTitle,
                    distance = 0.7 + ' mi',
                    _id;

                currentUserMatchRequestsRef.child(targetUserIDHashed).once('value', snapshot => {

                    if (snapshot.val() && snapshot.val().role === 'sender') {
                        _id = targetUserIDHashed + '_TO_' + currentUserIDHashed;
                        chatRoomActivityPreferenceTitle = this.props.currentUserData.activityPreference.title
                    }
                    else {
                        _id = currentUserIDHashed + '_TO_' + targetUserIDHashed;
                        chatRoomActivityPreferenceTitle = this.props.currentUserData.activityPreference.title
                    }

                    firebaseRef.child(`chat_rooms/${_id}`).once('value', snapshot => {

                        let chatRoomRef = firebaseRef.child(`chat_rooms/${_id}`),
                            currentRouteStack = this.props.navigator.getCurrentRoutes(),
                            chatRoomRoute = _.findWhere(currentRouteStack, {title: 'Chat', passProps: {_id}});

                        if (snapshot.val() === null) {

                            chatRoomRef.child('_id').set(_id); // @hmm: set unique chat Id
                            chatRoomRef.child('timer').set({value: 300000}); // @hmm: set timer
                            chatRoomRef.child('user_activity_preference_titles').child(currentUserIDHashed).set(this.props.currentUserData.activityPreference.title);
                            chatRoomRef.child('user_activity_preference_titles').child(targetUserIDHashed).set(this.props.data.activityPreference.title);

                        }

                        firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).once('value', snapshot => {
                            if (snapshot.val() === 0) {
                                _this.props.navigator.push({
                                    title: 'Chat',
                                    component: Chat,
                                    passProps: {
                                        _id,
                                        recipient: _this.props.data,
                                        distance,
                                        chatRoomActivityPreferenceTitle,
                                        chatRoomRef,
                                        currentUserData: _this.props.currentUserData
                                    }
                                });
                            }
                            else if (chatRoomRoute) _this.props.navigator.jumpTo(chatRoomRoute);
                            else {
                                currentRouteStack.push({
                                    title: 'Chat',
                                    component: Chat,
                                    passProps: {
                                        _id,
                                        recipient: _this.props.data,
                                        distance,
                                        chatRoomActivityPreferenceTitle,
                                        chatRoomRef,
                                        currentUserData: _this.props.currentUserData
                                    }
                                });
                                _this.props.navigator.immediatelyResetRouteStack(currentRouteStack);
                            }
                        });
                    })
                });
            }

            else {
                targetUserMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
                    status: 'received'
                }, 200);
                currentUserMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                    status: 'sent'
                }, 300);
            }
        }
    },

    _onPressItem() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({dir: this.state.dir === 'row' ? 'column' : 'row'});
    },

    _renderStatusIcon() {
        switch (this.state.status) {
            case 'sent':
                return <AwaitingResponseIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={() => this.handleMatchInteraction()}/>
            case 'received':
                return <ReceivedResponseIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={() => this.handleMatchInteraction()}/>
            case 'matched':
                return <MatchedIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={() => this.handleMatchInteraction()}/>
            default:
                return <ChevronIcon
                    color='rgba(0,0,0,0.2)'
                    direction='right'
                    onPress={() => this.handleMatchInteraction()}
                    size={22} />
        }
    },

    render() {
        if(this.state.status === null) return <View />;

        let profileModal, userRowContent;

        if(this.props.data && this.props.data.isEventInvite) {
            profileModal = (
                <View style={styles.profileModalContainer}>
                    <View
                        style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor()}]}>
                        <Image
                            source={{uri: this.props.data && this.props.data.picture}}
                            style={styles.profileModalUserPicture}/>
                        <Text
                            style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName}, {this.props.data && this.props.data.ageRange && this.props.data.ageRange.exactVal} {'\t'}
                            | {'\t'}
                            <Text style={styles.profileModalActivityInfo}>
                                <Text
                                    style={styles.profileModalActivityPreference}>YSO Halloween Show</Text>
                                {'\t'} {this.props.data && this.props.data.activityPreference && (this.props.data.activityPreference.start.time || this.props.data.activityPreference.status)} {'\n'}
                            </Text>
                        </Text>
                        <Text
                            style={styles.profileModalBio}>{this.props.data && this.props.data.bio}</Text>
                    </View>
                </View>
            )

            userRowContent = (
                <View style={styles.rightContainer}>
                    <Text
                        style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
                    <Text style={styles.eventTitle}>
                        YSO HALLOWEEN SHOW?
                    </Text>
                    <View style={{top: 10, right: 10}}>{this._renderStatusIcon()}</View>
                </View>
            )
        } else {
            profileModal = (
                <View style={styles.profileModalContainer}>
                    <View
                        style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor()}]}>
                        <Image
                            source={{uri: this.props.data && this.props.data.picture}}
                            style={styles.profileModalUserPicture}/>
                        <Text
                            style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName}, {this.props.data && this.props.data.ageRange && this.props.data.ageRange.exactVal} {'\t'} | {'\t'}
                            <Text style={styles.profileModalActivityInfo}>
                                <Text
                                    style={styles.profileModalActivityPreference}>{this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title && this.props.data.activityPreference.title.slice(0,-1)} </Text>:
                                {'\t'} {this.props.data && this.props.data.activityPreference && (this.props.data.activityPreference.start.time || this.props.data.activityPreference.status)} {'\n'}
                            </Text>
                        </Text>
                        <View style={[styles.tagBar, {bottom: 10}]}>
                            <Text
                                style={styles.profileModalSectionTitle}>TAGS: </Text>
                            {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.tags && this.props.data.activityPreference.tags.map((tag, i) => (
                                <TouchableOpacity key={i} style={styles.tag}><Text
                                    style={styles.tagText}>{tag}</Text></TouchableOpacity>
                            ))
                            }
                        </View>
                        <Text
                            style={styles.profileModalBio}>{this.props.data && this.props.data.bio}</Text>
                    </View>
                </View>
            );

            userRowContent = (
                <View style={styles.rightContainer}>
                    <Text style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
                    <Text style={styles.activityPreference}>
                        {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title}
                    </Text>
                    <View style={{top: 10}}>{this._renderStatusIcon()}</View>
                </View>
            );
        }

        return (
                <TouchableHighlight
                    underlayColor={WHITE_HEX_CODE}
                    activeOpacity={0.3}
                    onPress={this._onPressItem}
                    style={styles.userRow}>
                    <View
                        style={[styles.userContentWrapper, {flexDirection: this.state.dir}]}>
                        <LinearGradient
                            colors={(this.props.backgroundColor && [this.props.backgroundColor, this.props.backgroundColor]) || [this.getStatusColor(), this._getSecondaryStatusColor(), WHITE_HEX_CODE, 'transparent']}
                            start={[0,1]}
                            end={[1,1]}
                            locations={[0.3,0.99,1.0]}
                            style={styles.container}>
                            <Image
                                onPress={this._onPressItem}
                                source={{uri: this.props.data && this.props.data.picture}}
                                style={[styles.thumbnail]}>
                                <View style={(this.state.timerVal ? styles.timerValOverlay : {})}>
                                    <Text style={[styles.timerValText, (this.state.timerVal && this.state.timerVal[0] === '1' ? {color: '#FFF484'} : {}), (this.state.timerVal && this.state.timerVal[0] === '0' ? {color: '#F12A00'} :{})]}>{this.state.timerVal}</Text>
                                </View>
                            </Image>
                            {userRowContent}
                        </LinearGradient>
                        {this.state.dir === 'column' ? profileModal: <View />}
                    </View>
                </TouchableHighlight>
        );
    }
});

var ChatsList = React.createClass({
    mixins: [ReactFireMixin],

    watchID: null,

    getInitialState() {
        let firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/'),
            usersListRef = firebaseRef.child('users');

        return {
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            firebaseRef,
            userRows: [],
            showFunFact: true,
            showLoadingModal: true,
            usersListRef
        };
    },

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
            let eventInvites = [], usersListRef = this.state.firebaseRef.child('users'), _this = this;

            this.bindAsArray(usersListRef, 'userRows');

            this.props.ventureId && usersListRef.on('value', snapshot => {
                // @hmm: sweet! order alphabetically to sort with priority ('matched' --> 'received' --> 'sent')

                let usersListSnapshotVal = snapshot.val();

                usersListRef.child(`${this.props.ventureId}/event_invite_match_requests`).once('value', snapshot => {
                    _.each(snapshot.val(), (eventInviteMatchRequest) => {
                        eventInvites.push(eventInviteMatchRequest.account);
                    });

                    // @hmm: add event invites into general activity interactions

                    // @hmm: sort below

                    _this.updateRows((_.cloneDeep(_.values(usersListSnapshotVal))).concat(eventInvites));

                    _this.setState({currentUserVentureId: this.props.ventureId, userRows: _.cloneDeep(_.values((_.cloneDeep(_.values(usersListSnapshotVal))).concat(eventInvites))), usersListRef});

                    // @hmm: rest to prevent multiple event invites in chats list

                    eventInvites = [];

                    if(!_.isEmpty(usersListSnapshotVal[this.props.ventureId].match_requests) || !_.isEmpty(usersListSnapshotVal[this.props.ventureId].event_invite_match_requests)) this.setState({showFunFact: false});
                    else this.setState({showFunFact: true});

                    // @hmm: only show easing effect when fun fact reappears
                    if(!this.state.showFunFact) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

                });

            });

            this.state.firebaseRef.child(`users/${this.props.ventureId}`).once('value', snapshot => {
                _this.setState({currentUserData: snapshot.val()});
            });
        });
    },

    componentWillUnmount() {
        let usersListRef = this.state.firebaseRef.child('users');

        usersListRef.off();
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
    updateRows(userRows:Array) {
        this.setState({dataSource: this.state.dataSource.cloneWithRows(userRows)});
        InteractionManager.runAfterInteractions(() => {
            this.setState({showLoadingModal: false});
        });
    },
    _renderHeader() {
        return (
            <Header containerStyle={{position: 'relative'}}>
                <HomeIcon onPress={() => this._safelyNavigateToHome()} style={{right: 14}} />
                <Text>MY CHATS</Text>
                <FilterModalIcon
                    onPress={() => this._safelyNavigateForward({title: 'Filters', component: Filters, sceneConfig: Navigator.SceneConfigs.FloatFromBottom, passProps: {ventureId: this.state.currentUserVentureId}})}
                    style={{left: 14}} />
            </Header>
        )
    },

    _renderUser(user:Object, sectionID:number, rowID:number) {
        if (user.ventureId === this.state.currentUserVentureId) return <View />;

        return <User currentUserData={this.state.currentUserData}
                     currentUserIDHashed={this.state.currentUserVentureId}
                     currentUserLocationCoords={this.props.currentUserLocationCoords}
                     data={user}
                     firebaseRef={this.state.firebaseRef}
                     navigator={this.props.navigator}/>;
    },

    render() {
        let funFact = (
            <View style={{alignSelf: 'center', bottom: SCREEN_HEIGHT/2.5}}>
                <TouchableOpacity>
                    <Text
                        style={{color: '#fff', fontFamily: 'AvenirNextCondensed-Medium', textAlign: 'center', fontSize: 18}}>
                        <Text style={{fontSize: Display.height/30, top: 15}}>Did You Know ?</Text> {'\n\n'} 1 in every 16 Yale students {'\n'}
                        is a section asshole.</Text>
                </TouchableOpacity>
            </View>
        );

        return (
            <View style={styles.chatsListBaseContainer}>
                <View>
                    {this._renderHeader()}
                </View>
                <ListView
                    dataSource={this.state.dataSource}
                    renderRow={this._renderUser}
                    initialListSize={INITIAL_LIST_SIZE}
                    pageSize={PAGE_SIZE}
                    automaticallyAdjustContentInsets={false}
                    scrollRenderAheadDistance={200}/>
                {this.state.showFunFact ? funFact : <View />}
                <View style={{height: 48}}></View>
                <Modal
                    height={SCREEN_HEIGHT}
                    modalStyle={styles.loadingModalStyle}
                    isVisible={this.state.showLoadingModal}
                    swipeableAreaStyle={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                        }}
                    swipeHideLength={1.0}>
                    <View style={styles.modalView}>
                        <Logo
                            logoContainerStyle={styles.logoContainerStyle}
                            logoStyle={styles.logoStyle}/>
                        <ActivityIndicatorIOS
                            color='#fff'
                            animating={this.state.animating}
                            style={styles.loadingModalActivityIndicatorIOS}
                            size='small'/>
                        <TouchableOpacity activeOpacity={0.8}>
                            <Text
                                style={styles.loadingModalFunFactText}>
                                <Text style={styles.loadingModalFunFactTextTitle}>Did You Know ?</Text>
                                {'\n\n'} The average Yalie eats 5 chicken {'\n'} tenders in a week.</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </View>
        )
    }
});

var styles = StyleSheet.create({
    customRefreshingActivityIndicatorIOS: {
        height: 20,
        top: 5
    },
    customRefreshingIndicatorContainer: {
        alignSelf: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 10
    },
    customRefreshingIndicatorText: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    loadingModalActivityIndicatorIOS: {
        height: 80
    },
    loadingModalFunFactText: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Medium',
        textAlign: 'center',
        fontSize: 18,
        alignSelf: 'center',
        width: SCREEN_WIDTH / 1.4,
        backgroundColor: 'transparent',
        padding: SCREEN_WIDTH / 15,
        borderRadius: SCREEN_WIDTH / 10
    },
    loadingModalFunFactTextTitle: {
        fontSize: SCREEN_HEIGHT / 30
    },
    loadingModalStyle: {
        backgroundColor: '#02030F'
    },
    logoContainerStyle: {
        marginHorizontal: (SCREEN_WIDTH - LOGO_WIDTH) / 2
    },
    logoStyle: {
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT
    },
    modalView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    profileModal: {
        paddingVertical: SCREEN_HEIGHT / 30,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    profileModalContainer: {
        backgroundColor: WHITE_HEX_CODE
    },
    profileModalActivityInfo: {
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    profileModalActivityPreference: {
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    profileModalBio: {
        color: '#222',
        fontFamily: 'AvenirNextCondensed-Medium',
        textAlign: 'center',
        fontSize: 16,
        marginTop: 15
    },
    profileModalNameAgeInfo: {
        color: '#222',
        fontSize: 20,
        fontFamily: 'AvenirNextCondensed-Medium',
        textAlign: 'center'
    },
    profileModalSectionTitle: {
        color: '#222',
        fontSize: 16,
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    profileModalUserPicture: {
        width: SCREEN_WIDTH / 2.6,
        height: SCREEN_WIDTH / 2.6,
        borderRadius: SCREEN_WIDTH / 5.2,
        alignSelf: 'center',
        marginBottom: SCREEN_WIDTH / 22
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    tag: {
        backgroundColor: 'rgba(4,22,43,0.5)',
        borderRadius: 12,
        paddingHorizontal: Display.width / 80,
        marginHorizontal: Display.width / 70,
        paddingVertical: Display.width / 170,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.4)'
    },
    tagBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    tagText: {
        color: 'rgba(255,255,255,0.95)',
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    thumbnail: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: THUMBNAIL_SIZE/2,
        marginVertical: 7,
        marginLeft: 10
    },
    userContentWrapper: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent'
    },
    userRow: {
        flex: 1,
        backgroundColor: '#fefefb'
    },
    chatsListBaseContainer: {
        flex: 1,
        backgroundColor: '#040A19'
    },
    activityPreference: {
        width: 140,
        fontSize: 18,
        fontFamily: 'AvenirNextCondensed-UltraLight',
        fontWeight: '400'
    },
    backdrop: {
        paddingTop: 30,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: Display.width,
        height: Display.height
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'rgba(100,100,105,0.2)',
        borderWidth: 1
    },
    distance: {
        width: 75,
        textAlign: 'center',
        fontSize: 16,
        marginHorizontal: 25,
        fontFamily: 'AvenirNext-UltraLight',
        fontWeight: '300'
    },
    eventTitle: {
        width: 154,
        right: 20,
        fontSize: 17,
        top: 2,
        fontFamily: 'AvenirNextCondensed-Regular',
        fontWeight: '400'
    },
    filterPageButton: {
        width: 30,
        height: 30
    },
    timerValText: {
        opacity: 1.0,
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Medium',
    },
    timerValOverlay: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: THUMBNAIL_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

module.exports = ChatsList;