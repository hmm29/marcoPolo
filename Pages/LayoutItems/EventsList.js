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
var CheckboxIcon = require('../../Partials/Icons/CheckboxIcon');
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
var SEARCH_TEXT_INPUT_REF = 'searchTextInput'

var YELLOW_HEX_CODE = '#ffe770';
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
        isCurrentUser: React.PropTypes.boolean,
        navigator: React.PropTypes.object
    },

    getInitialState() {
        return {
            dir: 'row',
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            status: '',
            timerVal: ''
        }
    },

    componentWillMount() {
        let distance = this.calculateDistance(this.props.currentUserLocationCoords, [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]),
            _this = this;

        this.state.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.state.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
        && (this.state.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).on('value', snapshot => {
            _this.setState({
                distance,
                status: snapshot.val() && snapshot.val().status,
                timerVal: snapshot.val() && snapshot.val().timerVal && this._getTimerValue(snapshot.val().timerVal)
            });
        });
    },

    componentWillReceiveProps(nextProps) {
        let distance = this.calculateDistance(this.props.currentUserLocationCoords, [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]),
            _this = this;

        this.state.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.state.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
        && (this.state.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).on('value', snapshot => {
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
            currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/match_requests');

        currentUserMatchRequestsRef && currentUserMatchRequestsRef.off();
    },

    calculateDistance(location1:Array, location2:Array) {
        return location1 && location2 && (GeoFire.distance(location1, location2) * 0.621371).toFixed(1);
    },

    _getSecondaryStatusColor() {
        if (this.props.isCurrentUser) return '#FBFBF1';

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

            targetUserMatchRequestsRef.child(currentUserIDHashed).setWithPriority({
                status: 'matched',
                role: 'recipient'
            }, 100);

            currentUserMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                status: 'matched',
                role: 'sender'
            }, 100);
        }

        else if (this.state.status === 'matched') {
            let chatRoomActivityPreferenceTitle,
                distance = 0.7 + ' mi',
                _id;

            currentUserMatchRequestsRef.child(targetUserIDHashed).once('value', snapshot => {

                if (snapshot.val() && snapshot.val().role === 'sender') {
                    _id = targetUserIDHashed + '_TO_' + currentUserIDHashed;
                    chatRoomActivityPreferenceTitle = this.props.currentUserData.activityPreference.title
                } else {
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
                        style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.name && this.props.data.name.split(" ")[0]}, {this.props.data && this.props.data.ageRange && this.props.data.ageRange.exactVal} {'\t'}
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
                                    <Text style={[styles.timerValText, (this.state.timerVal && this.state.timerVal[0] === '1' ? {color: '#FFF484'} : {}), (this.state.timerVal && this.state.timerVal[0] === '0' ? {color: '#F12A00'} :{})]}>{this.state.timerVal}</Text>
                                </View>
                            </Image>
                            <View style={styles.rightContainer}>
                                <Text
                                    style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
                                <Text style={styles.activityPreference}>
                                    YSO HALLOWEEN SHOW?
                                </Text>
                                <View>
                                    {!this.props.isCurrentUser ?
                                        <View style={{top: 10, right: 10}}>{this._renderStatusIcon()}</View> : <View />}
                                </View>
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
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            rows: []
        };
    },

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
            let attendeesListRef = this.props.eventsListRef && this.props.eventId
                    && this.props.eventsListRef.child(`${this.props.eventId}/attendees`),
                usersListRef = this.state.firebaseRef && this.state.firebaseRef.child('users'),
                _this = this;

            attendeesListRef.on('value', snapshot => {
                InteractionManager.runAfterInteractions(() => {
                    _this.updateRows(_.cloneDeep(_.values(snapshot.val())));
                    _this.setState({rows: _.cloneDeep(_.values(snapshot.val())), attendeesListRef, usersListRef});
                });

            });

            this.bindAsArray(usersListRef, 'rows');

            this.state.firebaseRef.child(`/users/${this.props.ventureId}`).once('value', snapshot => {
                _this.setState({currentUserData: snapshot.val()});
            });

        });
    },

    componentWillUnmount() {
        this.state.currentUserRef.off();
        this.state.usersListRef.off();
    },

    updateRows(rows) {
        this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
    },

    _renderHeader() {
        return (
            <Header>
                <View />
                <Text>WHO'S GOING TO: <Text style={{color: '#F06449'}}>YSO HALLOWEEN SHOW</Text></Text>
                <CloseIcon style={{bottom: SCREEN_HEIGHT / 15, left: SCREEN_WIDTH / 18}} size={38} onPress={this.props.closeGuestListModal} />
            </Header>
        )
    },


    _renderUser(user:Object, sectionID:number, rowID:number) {
        // if (user.ventureId === this.props.ventureId) return <View />;

        return <User currentUserData={this.state.currentUserData}
                     currentUserIDHashed={this.props.ventureId}
                     currentUserLocationCoords={this.props.currentUserLocationCoords}
                     data={user}
                     firebaseRef={this.state.firebaseRef}
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

        this.props.eventsListRef && this.props.data && this.props.currentUserData
        && this.props.currentUserIDHashed && this.props.data.id
        && this.props.eventsListRef.child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`).once('value', snapshot => {
            if(snapshot.val()) _this.setState({status: 'attending'});
            else _this.setState({status: 'notAttending'});
        });

    },

    componentWillUnmount() {
        let currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/match_requests');

        currentUserMatchRequestsRef && currentUserMatchRequestsRef.off();
    },

    _getSecondaryStatusColor() {
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
                return WHITE_HEX_CODE;
        }
    },

    handleEventInteraction() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (this.state.status === 'notAttending') {
            this.setState({status: 'attending'});
            this.props.eventsListRef && this.props.data && this.props.currentUserData && this.props.currentUserIDHashed && this.props.data.id && this.props.eventsListRef.child(`${this.props.data.id}/attendees/${this.props.currentUserIDHashed}`).set(_.pick(this.props.currentUserData, 'name', 'picture', 'ventureId', 'bio', 'ageRange', 'location'))
            this.props.usersListRef && this.props.data && this.props.currentUserIDHashed && this.props.data.id && this.props.usersListRef.child(`${this.props.currentUserIDHashed}/events/${this.props.data.id}`).set(_.pick(this.props.data, 'id', 'title', 'description', 'location', 'start'))

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
    },

    _renderStatusIcon() {
        switch (this.state.status) {
            case 'attending':
                return <CheckboxIcon
                    active={true}
                    onPress={this.handleEventInteraction}
                    size={36}
                    style={{borderRadius: 28, top: SCREEN_HEIGHT / 85 }}
                    />;
            default:
                return <ChevronIcon
                    color='rgba(0,0,0,0.8)'
                    direction='right'
                    onPress={this.handleEventInteraction}
                    size={22}
                    style={{backgroundColor: 'rgba(255,255,255,0.9)', marginHorizontal: 20, borderRadius: 14, top: SCREEN_HEIGHT / 85}}
                    />
        }
    },

    render() {

        let profileModal = (
            <View style={[styles.profileModalContainer, {flexDirection: 'column', alignItems: 'center'}]}>
                <View
                    style={[styles.profileModal, {backgroundColor: this._getSecondaryStatusColor(), alignSelf: 'stretch', alignItems: 'center'}]}>
                    <Text style={styles.profileModalNameAgeInfo}>WHEN: {this.props.data && this.props.data.start && this.props.data.start.date}, {this.props.data && this.props.data.start && this.props.data.start.dateTime} {'\n'}
                    </Text>
                    <Text style={styles.profileModalNameAgeInfo}>WHERE: {this.props.data && this.props.data.location} {'\n'}
                    </Text>
                    <Text style={styles.profileModalSectionTitle}>EVENT DESCRIPTION:</Text>
                    <Text style={[styles.profileModalBio, {width: SCREEN_WIDTH / 1.4}]}>{this.props.data && this.props.data.description} {'\n'}</Text>
                    <Text style={styles.profileModalSectionTitle}>EVENT DESCRIPTION: {'\n'}</Text>
                    <TouchableOpacity onPress={this.props.openGuestListModal}><Text style={{color: '#3F7CFF'}}>WHO'S GOING?</Text></TouchableOpacity>

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
                                source={{uri: this.props.data && this.props.data.event_img}}
                                style={{resizeMode: 'stretch', flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View
                                onPress={this._onPressItem}
                                style={[styles.eventThumbnail, {backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center'}]}>
                                    <Text style={{color: '#fff'}}>Y S O</Text>
                                </View>
                            <View style={[styles.rightContainer, {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}]}>
                                        {this._renderStatusIcon()}
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
            searchText: '',
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

        eventsListRef.off();
        usersListRef.off();
    },

    _openGuestListModal() {
      this.setState({showGuestListModal: true});
    },

    _closeGuestListModal() {
        this.setState({showGuestListModal: false});
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

        return <Event currentUserData={this.state.currentUserData}
                      currentUserIDHashed={this.state.currentUserVentureId}
                     data={event}
                     eventsListRef={this.state.eventsListRef} 
                     firebaseRef={this.state.firebaseRef}
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
                                {'\n\n'} 15% of Yalies don't know {'\n'} why they chose Yale.</Text>
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
                       <GuestList
                           closeGuestListModal={this._closeGuestListModal}
                           eventId={hash('YSO Halloween Show')}
                           eventsListRef={this.state.eventsListRef}
                           navigator={this.props.navigator}
                           ventureId={this.props.ventureId} />
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
    searchTextInput: {
        color: '#222',
        backgroundColor: 'white',
        borderRadius: 3,
        borderWidth: 1,
        width: 200,
        height: 30,
        paddingLeft: 10,
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'AvenirNextCondensed-Regular'
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
    activityPreference: {
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

var animations = {
    layout: {
        spring: {
            duration: 750,
            create: {
                duration: 300,
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.opacity
            },
            update: {
                type: LayoutAnimation.Types.spring,
                springDamping: 0.6
            }
        },
        easeInEaseOut: {
            duration: 300,
            create: {
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.scaleXY
            },
            update: {
                delay: 100,
                type: LayoutAnimation.Types.easeInEaseOut
            }
        }
    }
};

var layoutAnimationConfigs = [
    animations.layout.spring,
    animations.layout.easeInEaseOut
];


module.exports = EventsList;