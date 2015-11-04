/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule EventsList
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
var CheckBoxIcon = require('../../Partials/Icons/CheckBoxIcon');
var ChevronIcon = require('../../Partials/Icons/ChevronIcon');
var CloseIcon = require('../../Partials/Icons/CloseIcon');
var Display = require('react-native-device-display');
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
var sha256 = require('sha256');
var TimerMixin = require('react-timer-mixin');

var INITIAL_LIST_SIZE = 8;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var PAGE_SIZE = 10;
var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;

var YELLOW_HEX_CODE = '#ffe770';
var BLACK_HEX_CODE = '#000';
var BLUE_HEX_CODE = '#40cbfb';
var GREEN_HEX_CODE = '#84FF9B';
var WHITE_HEX_CODE = '#fff';
var THUMBNAIL_SIZE = 50;

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};

var hash = (msg:string) => sha256(msg);

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
            timerVal: ''
        }
    },

    componentWillMount() {
        let distance = this.calculateDistance(this.props.currentUserLocationCoords, [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]),
            _this = this;

        this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`).child(this.props.data.ventureId)
        && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/event_invite_match_requests`).child(this.props.data.ventureId).on('value', snapshot => {
            _this.setState({
                distance,
                status: snapshot.val() && snapshot.val().status,
                timerVal: snapshot.val() && snapshot.val().timerVal && this._getTimerValue(snapshot.val().timerVal)
            });
        });
    },

    componentWillReceiveProps(nextProps) {
        let distance = this.calculateDistance(nextProps.currentUserLocationCoords, [nextProps.data.location.coordinates.latitude, nextProps.data.location.coordinates.longitude]),
            _this = this;

        nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/event_invite_match_requests`).child(nextProps.data.ventureId)
        && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/event_invite_match_requests`).child(nextProps.data.ventureId).on('value', snapshot => {
            _this.setState({
                distance,
                status: snapshot.val() && snapshot.val().status,
                timerVal: snapshot.val() && snapshot.val().timerVal && this._getTimerValue(snapshot.val().timerVal)
            });
        });
    },

    componentWillUnmount() {
        let currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/event_invite_match_requests');

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
                account: this.props.currentUserData && _.assign(_.pick(this.props.currentUserData, 'firstName', 'picture', 'ventureId', 'bio', 'age', 'location'), {isEventInvite: true, eventTitle: this.props.eventTitle, eventId: this.props.eventId, eventLogistics: this.props.eventLogistics}),
                eventId: this.props.eventId,
                eventTitle: this.props.eventTitle,
                _id: currentUserIDHashed,
                status: 'matched',
                role: 'recipient'
            }, 100);

            currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                account: this.props.data && _.assign(_.pick(this.props.data, 'firstName', 'picture', 'ventureId', 'bio', 'age', 'location'), {isEventInvite: true, eventTitle: this.props.eventTitle, eventId: this.props.eventId, eventLogistics: this.props.eventLogistics}),
                eventId: this.props.eventId,
                eventTitle: this.props.eventTitle,
                _id: targetUserIDHashed,
                status: 'matched',
                role: 'sender'
            }, 100);
        }

        else if (this.state.status === 'matched') {
            let chatRoomEventTitle = this.props.eventTitle,
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
                        chatRoomRef.child('user_activity_preference_titles').child(currentUserIDHashed).set(chatRoomEventTitle);
                        chatRoomRef.child('user_activity_preference_titles').child(targetUserIDHashed).set(chatRoomEventTitle);

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
                account: this.props.currentUserData && _.assign(_.pick(this.props.currentUserData, 'firstName', 'picture', 'ventureId', 'bio', 'age', 'location'), {isEventInvite: true, eventTitle: this.props.eventTitle, eventId: this.props.eventId, eventLogistics: this.props.eventLogistics}),
                eventId: this.props.eventId,
                eventTitle: this.props.eventTitle,
                status: 'received'
            }, 200);
            currentUserEventInviteMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                account: this.props.data && _.assign(_.pick(this.props.data, 'firstName', 'picture', 'ventureId', 'bio', 'age', 'location'), {isEventInvite: true, eventTitle: this.props.eventTitle, eventId: this.props.eventId, eventLogistics: this.props.eventLogistics}),
                eventId: this.props.eventId,
                eventTitle: this.props.eventTitle,
                status: 'sent'
            }, 300);
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
                    onPress={this.handleMatchInteraction}/>
            case 'received':
                return <ReceivedResponseIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={this.handleMatchInteraction}/>
            case 'matched':
                return <MatchedIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={this.handleMatchInteraction}/>
            default:
                return <ChevronIcon
                    color='rgba(0,0,0,0.2)'
                    direction='right'
                    onPress={this.handleMatchInteraction}
                    size={18}
                    style={{left: 8}}/>
        }
    },

    render() {
        let profileModal = (
            <View style={styles.profileModalContainer}>
                <View
                    style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor()}]}>
                    <Image
                        source={{uri: this.props.data && this.props.data.picture}}
                        style={styles.profileModalUserPicture}/>
                    <Text
                        style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName}, {this.props.data && this.props.data.age && this.props.data.age.value} {'\t'}
                        | {'\t'}
                        <Text style={styles.profileModalActivityInfo}>
                            <Text
                                style={styles.profileModalActivityPreference}>{this.props.eventTitle}</Text>
                            {'\t'} {this.props.data && this.props.data.activityPreference && (this.props.data.activityPreference.start.time || this.props.data.activityPreference.status)} {'\n'}
                        </Text>
                    </Text>
                    <Text
                        style={[styles.profileModalSectionTitle, {textAlign: 'center'}]}>{this.props.eventLogistics}</Text>
                    <Text
                        style={styles.profileModalBio}>{this.props.data && this.props.data.bio}</Text>
                </View>
            </View>
        );

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
                                    <Text style={[styles.timerValText, (this.state.timerVal && this.state.timerVal[0] === '0' ? {color: '#F12A00'} :{})]}>{this.state.timerVal}</Text>
                                </View>
                            </Image>
                            <View style={styles.rightContainer}>
                                <Text
                                    style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
                                <Text style={styles.eventTitle}>
                                    {this.props.eventTitle} ?
                                </Text>
                               <View style={{top: 10, right: 10}}>{this._renderStatusIcon()}</View>
                            </View>
                        </LinearGradient>
                        {this.state.dir === 'column' ? profileModal : <View />}
                    </View>
                </TouchableHighlight>
        );
    }
});


var GuestList = React.createClass({
    mixins: [TimerMixin, ReactFireMixin],

    getInitialState() {
        return {
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            rows: []
        };
    },

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
            let attendeesListRef = this.props.eventsListRef && this.props.eventData && this.props.eventData.id
                    && this.props.eventsListRef.child(`${this.props.eventData.id}/attendees`),
                usersListRef = this.props.firebaseRef && this.props.firebaseRef.child('users'),
                _this = this;

            attendeesListRef && attendeesListRef.on('value', snapshot => {
                InteractionManager.runAfterInteractions(() => {
                    _this.updateRows(_.cloneDeep(_.values(snapshot.val())));
                    _this.setState({rows: _.cloneDeep(_.values(snapshot.val())), attendeesListRef, usersListRef});
                });

            });

            this.bindAsArray(usersListRef, 'rows');
        });
    },

    componentWillUnmount() {
        this.state.currentUserRef && this.state.currentUserRef.off();
        this.state.usersListRef && this.state.usersListRef.off();
    },

    updateRows(rows) {
        this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
    },

    _renderHeader() {
        return (
            <Header>
                <View />
                <Text>WHO'S GOING TO : <Text style={{color: '#F06449'}}>{this.props.eventData && this.props.eventData.title}</Text></Text>
                <CloseIcon style={{bottom: SCREEN_HEIGHT / 15, left: SCREEN_WIDTH / 18}} size={28} onPress={this.props.closeGuestListModal} />
            </Header>
        )
    },


    _renderUser(user:Object, sectionID:number, rowID:number) {
        if (user.ventureId === this.props.ventureId) return <View />;

        return <User currentUserData={this.props.currentUserData}
                     currentUserIDHashed={this.props.ventureId}
                     currentUserLocationCoords={this.props.currentUserLocationCoords}
                     data={user}
                     eventId={this.props.eventData && this.props.eventData.id}
                     eventLogistics={`${this.props.eventData && this.props.eventData.start && this.props.eventData.start.date}, ${this.props.eventData && this.props.eventData.start && this.props.eventData.start.dateTime}\t | \t${this.props.eventData && this.props.eventData.location}`}
                     eventTitle={this.props.eventData && this.props.eventData.title}
                     firebaseRef={this.props.firebaseRef}
                     navigator={this.props.navigator}/>;
    },

    render() {
        return (
            <View style={styles.guestListBaseContainer}>
                    {this._renderHeader()}
                <ListView
                    dataSource={this.state.dataSource}
                    renderRow={this._renderUser}
                    initialListSize={INITIAL_LIST_SIZE}
                    pageSize={PAGE_SIZE}
                    automaticallyAdjustContentInsets={false}
                    scrollRenderAheadDistance={600} />
            </View>
        )
    }
});

var Event = React.createClass({
    getInitialState() {
        return {
            dir: 'row',
            status: 'notAttending'
        }
    },

    componentWillMount() {
        let _this = this;

        this.props.eventsListRef && this.props.data && this.props.currentUserData
        && this.props.currentUserIDHashed && this.props.data.id
        && this.props.eventsListRef.child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`).once('value', snapshot => {
           if(snapshot.val()) _this.setState({status: 'attending'});
           else _this.setState({status: 'notAttending'});
        });

    },

    componentWillReceiveProps(nextProps) {

        let _this = this;

        nextProps.eventsListRef && nextProps.data && nextProps.currentUserData
        && nextProps.currentUserIDHashed && nextProps.data.id
        && nextProps.eventsListRef.child(`${nextProps.data.id}/attendees/${nextProps.currentUserIDHashed}`).once('value', snapshot => {
            _this.setState({status: ''})
            if(snapshot.val()) _this.setState({status: 'attending'});
            else _this.setState({status: 'notAttending'});
        });

    },

    componentWillUnmount() {
        let currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/event_invite_match_requests');

        currentUserMatchRequestsRef && currentUserMatchRequestsRef.off();
    },

    _getSecondaryStatusColor() {
        switch (this.state.status) {
            case 'attending':
                return '#AAFFA9';
            default:
                return '#111';
        }
    },

    _getEventProfileBackgroundColor() {
        switch (this.state.status) {
            case 'attending':
                return '#AAFFA9';
            default:
                return '#FBFBF1';
        }
    },

    getStatusColor() {
        switch (this.state.status) {
            case 'attending':
                return GREEN_HEX_CODE;
            default:
                return BLACK_HEX_CODE;
        }
    },

    handleEventInteraction() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (this.state.status === 'notAttending') {
            this.setState({status: 'attending'});
            this.props.eventsListRef && this.props.data && this.props.currentUserData && this.props.currentUserIDHashed && this.props.data.id && this.props.eventsListRef.child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`).set(_.pick(this.props.currentUserData, 'firstName', 'name', 'picture', 'ventureId', 'bio', 'age', 'location'))
            this.props.usersListRef && this.props.data && this.props.currentUserIDHashed && this.props.data.id && this.props.usersListRef.child(`${this.props.currentUserIDHashed}/events/${this.props.data.id}`).set(_.pick(this.props.data, 'id', 'title', 'description', 'location', 'start'));

        }
        else {
            this.setState({status: 'notAttending'});
            this.props.eventsListRef && this.props.data && this.props.currentUserData && this.props.currentUserIDHashed && this.props.data.id && this.props.eventsListRef.child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`).set(null);
            this.props.usersListRef && this.props.data && this.props.currentUserIDHashed && this.props.data.id && this.props.usersListRef.child(`${this.props.currentUserIDHashed}/events/${this.props.data.id}`).set(null);
        }
    },

    _onPressItem() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({dir: this.state.dir === 'row' ? 'column' : 'row'});
        // @hmm: set to selected event for guest list
        // have to press item to access guest list so makes sense to change selected event here

        this.props.handleSelectedEventStateChange(this.props.data);
    },

    _renderEventAttendanceStatusIcon() {
        switch (this.state.status) {
            case 'attending':
                return <CheckBoxIcon
                    active={true}
                    onPress={this.handleEventInteraction}
                    size={26}
                    style={{borderRadius: 28, top: 1, right: SCREEN_HEIGHT / 90}}
                    />;
            default:
                return <ChevronIcon
                    color='rgba(0,0,0,0.8)'
                    direction='right'
                    onPress={this.handleEventInteraction}
                    size={14}
                    style={{backgroundColor: 'rgba(255,255,255,0.9)', width: 22, height: 22, marginHorizontal: 20, borderRadius: 11, justifyContent: 'center', alignItems: 'center', top: 8, left: SCREEN_HEIGHT / 90}}
                    />
        }
    },

    render() {

        let profileModal = (
            <View style={[styles.profileModalContainer, {flexDirection: 'column', alignItems: 'center'}]}>
                <View
                    style={[styles.profileModal, {backgroundColor: this._getEventProfileBackgroundColor(), alignSelf: 'stretch', alignItems: 'center'}]}>
                    <Text style={styles.profileModalNameAgeInfo}>WHEN: {this.props.data && this.props.data.start && this.props.data.start.date}, {this.props.data && this.props.data.start && this.props.data.start.dateTime} {'\n'}
                    </Text>
                    <Text style={styles.profileModalNameAgeInfo}>WHERE: {this.props.data && this.props.data.location} {'\n'}
                    </Text>
                    <Text style={styles.profileModalSectionTitle}>EVENT DESCRIPTION:</Text>
                    <Text style={[styles.profileModalBio, {width: SCREEN_WIDTH / 1.4}]}>{this.props.data && this.props.data.description} {'\n'}</Text>
                    <Text style={styles.profileModalSectionTitle}>EVENT DESCRIPTION: {'\n'}</Text>
                    <TouchableOpacity onPress={() => {
                        this.props.openGuestListModal();
                    }} style={{backgroundColor: 'rgba(0,0,0,0.001)'}}><Text style={{color: '#3F7CFF', fontFamily: 'AvenirNextCondensed-Medium', fontSize: 20, paddingHorizontal: 40, paddingBottoml: 10}}>WHO'S GOING?</Text></TouchableOpacity>

                </View>
            </View>
        );

        return (
                <TouchableHighlight
                    underlayColor={WHITE_HEX_CODE}
                    activeOpacity={0.9}
                    onPress={this._onPressItem}
                    style={[styles.userRow, {height: THUMBNAIL_SIZE * 2}]}>
                    <View
                        style={[styles.userContentWrapper, {flexDirection: this.state.dir}]}>
                        <LinearGradient
                            colors={(this.props.backgroundColor && [this.props.backgroundColor, this.props.backgroundColor]) || [this.getStatusColor(), this._getSecondaryStatusColor(), WHITE_HEX_CODE, 'transparent']}
                            start={[0,1]}
                            end={[1,1]}
                            locations={[0.3,0.99,1.0]}
                            style={styles.container}>
                            <Image
                                source={{uri: this.props.data && this.props.data.event_img}}
                                style={{resizeMode: 'cover', height: THUMBNAIL_SIZE * 2, flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View
                                onPress={this._onPressItem}
                                style={[styles.eventThumbnail, {backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center'}]}>
                                    <Text style={{fontFamily: 'AvenirNextCondensed-Regular', color: '#fff'}}>{this.props.data && this.props.data.organization && this.props.data.organization.displayName && this.props.data.organization.displayName.split('').join(' ')}</Text>
                                </View>
                            <View style={[styles.rightContainer, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
                                        <Text style={styles.eventTitleBanner}>{this.props.data && this.props.data.title && this.props.data.title.toUpperCase()}</Text>
                                        <View style={{position: 'absolute', right: 16}}>{this._renderEventAttendanceStatusIcon()}</View>
                            </View>
                                </Image>
                        </LinearGradient>
                        {this.state.dir === 'column' ? profileModal: <View />}
                    </View>
                </TouchableHighlight>
        );
    }
});

var EventsList = React.createClass({
    mixins: [ReactFireMixin],

    watchID: null,

    getInitialState() {
        let firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/'),
            eventsListRef = firebaseRef && firebaseRef.child('events'),
            usersListRef = firebaseRef && firebaseRef.child('users');

        return {
            currentPosition: null,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            eventsListRef,
            firebaseRef,
            eventsRows: [],
            selectedEvent: null,
            showGuestListModal: false,
            showLoadingModal: true,
            userRows: [],
            usersListRef
        };
    },

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
             let eventsListRef = this.state.eventsListRef,
                 usersListRef = this.state.usersListRef,
                 _this = this;

            this.bindAsArray(usersListRef, 'userRows');
            this.bindAsArray(eventsListRef, 'eventsRows');

            eventsListRef.on('value', snapshot => {
                _this.updateRows(_.cloneDeep(_.values(snapshot.val())));
                _this.setState({eventsRows: _.cloneDeep(_.values(snapshot.val())), eventsListRef, usersListRef});
            });

            this.setState({currentUserVentureId: this.props.ventureId})

            this.state.firebaseRef.child(`/users/${this.props.ventureId}`).once('value', snapshot => {
                _this.setState({currentUserData: snapshot.val()});
            });

        });
    },

    componentWillUnmount() {
        let eventsListRef = this.state.eventsListRef,
            usersListRef = this.state.usersListRef;

        eventsListRef && eventsListRef.off();
        eventsListRef && usersListRef.off();
    },

    _openGuestListModal() {
      this.setState({showGuestListModal: true});
    },

    _closeGuestListModal() {
        this.setState({showGuestListModal: false});
    },

    _handleSelectedEventStateChange(selectedEvent: Object) {
        this.setState({selectedEvent});
    },

    _safelyNavigateToHome() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
            homeRoute = currentRouteStack[0];

        if(currentRouteStack.indexOf(homeRoute) > -1) this.props.navigator.jumpTo(homeRoute);
    },

    updateRows(eventsRows:Array) {
        this.setState({dataSource: this.state.dataSource.cloneWithRows(eventsRows)});
        InteractionManager.runAfterInteractions(() => {
            this.setState({showLoadingModal: false});
        })
    },
    _renderHeader() {
        return (
            <Header containerStyle={{position: 'relative'}}>
                <HomeIcon onPress={() => this._safelyNavigateToHome()} style={{right: 14}}/>
                <Text>EVENTS</Text>
                <View />
            </Header>
        )
    },


    _renderEvent(event:Object, sectionID:number, rowID:number) {
        if(this.state.visibleRows && this.state.visibleRows[sectionID] && this.state.visibleRows[sectionID][rowID] && !this.state.visibleRows[sectionID][rowID]) return <View />;

        return <Event currentUserData={this.state.currentUserData}
                      currentUserIDHashed={this.state.currentUserVentureId}
                      data={event}
                      eventsListRef={this.state.eventsListRef}
                      firebaseRef={this.state.firebaseRef}
                      handleSelectedEventStateChange={this._handleSelectedEventStateChange}
                      openGuestListModal={this._openGuestListModal}
                      navigator={this.props.navigator}
                      usersListRef={this.state.usersListRef}
                />;
    },

    render() {
        return (
            <View style={styles.eventsListBaseContainer}>
                <View>
                    {this._renderHeader()}
                </View>
                <ListView
                    dataSource={this.state.dataSource}
                    renderRow={this._renderEvent}
                    initialListSize={INITIAL_LIST_SIZE}
                    pageSize={PAGE_SIZE}
                    onChangeVisibleRows={(visibleRows, changedRows) => this.setState({visibleRows, changedRows})}
                    automaticallyAdjustContentInsets={false}
                    scrollRenderAheadDistance={200}/>
                <View style={{height: 48}}></View>
                <Modal
                    height={SCREEN_HEIGHT}
                    modalStyle={styles.modalStyle}
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
                                {'\n\n'} The phrase "Let's grab a meal" has a 12% success rate.</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
                <Modal
                    height={SCREEN_HEIGHT}
                    modalStyle={styles.modalStyle}
                    isVisible={this.state.showGuestListModal}
                    swipeableAreaStyle={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                        }}
                    swipeHideLength={1.0}>
                    <View>
                        {this.state.selectedEvent ?
                       <GuestList
                           closeGuestListModal={this._closeGuestListModal}
                           currentUserData={this.state.currentUserData}
                           currentUserLocationCoords={this.props.currentUserLocationCoords}
                           eventData={this.state.selectedEvent}
                           eventsListRef={this.state.eventsListRef}
                           firebaseRef={this.state.firebaseRef}
                           navigator={this.props.navigator}
                           ventureId={this.props.ventureId} /> : <View/> }
                    </View>
                </Modal>
            </View>
        )
    }
});

var styles = StyleSheet.create({
    modalStyle: {
        backgroundColor: '#02030F'
    },
    eventThumbnail: {
        width: SCREEN_HEIGHT / 10,
        height: SCREEN_HEIGHT / 10,
        borderRadius: SCREEN_HEIGHT / 20,
        marginVertical: 7,
        marginLeft: 10
    },
    eventsListBaseContainer: {
        flex: 1,
        backgroundColor: '#040A19'
    },
    eventTitleBanner: {
        fontFamily: 'AvenirNextCondensed-Medium',
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: SCREEN_WIDTH / 1.2,
        fontSize: SCREEN_HEIGHT / 35,
        paddingVertical: SCREEN_HEIGHT / 130,
        paddingLeft: SCREEN_WIDTH / 15,
        paddingRight: SCREEN_WIDTH / 9.5,
        textAlign: 'center',
        right: SCREEN_WIDTH / 30
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
    thumbnail: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: THUMBNAIL_SIZE / 2,
        marginVertical: 7,
        marginLeft: 10
    },
    timerValOverlay: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: THUMBNAIL_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center'
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
    guestListBaseContainer: {
        flex: 1,
        backgroundColor: '#040A19',
        paddingTop: SCREEN_HEIGHT / 18
    },
    eventTitle: {
        width: 154,
        right: 20,
        fontSize: 17,
        top: 2,
        fontFamily: 'AvenirNextCondensed-Regular',
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
        right: 10,
        textAlign: 'center',
        fontSize: 16,
        marginHorizontal: 25,
        fontFamily: 'AvenirNext-UltraLight',
        fontWeight: '300'
    },
    filterPageButton: {
        width: 30,
        height: 30
    },
    timerValText: {
        opacity: 1.0,
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Medium'
    }
});

module.exports = EventsList;