/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule UsersList
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
var ReceivedResponseIcon = require('../../Partials/Icons/ReceivedResponseIcon');
var RefreshableListView = require('react-native-refreshable-listview');
var TimerMixin = require('react-timer-mixin');

var INITIAL_LIST_SIZE = 8;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var PAGE_SIZE = 10;
var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;
var SEARCH_TEXT_INPUT_REF = 'searchTextInput';
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
        isCurrentUser: React.PropTypes.boolean,
        navigator: React.PropTypes.object
    },

    getInitialState() {
        return {
            dir: 'row',
            timerVal: ''
        }
    },

    componentWillMount() {
        let distance = this.props.currentUserLocationCoords && this.props.data.location.coordinates && this.calculateDistance(this.props.currentUserLocationCoords, [this.props.data.location.coordinates.latitude, this.props.data.location.coordinates.longitude]),
            _this = this;

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
    },

    componentWillReceiveProps(nextProps) {
        let distance = this.calculateDistance(nextProps.currentUserLocationCoords, [nextProps.data.location.coordinates.latitude, nextProps.data.location.coordinates.longitude]),
            _this = this;

        nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId)
        && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId).off();

        nextProps.firebaseRef && nextProps.data && nextProps.data.ventureId && nextProps.currentUserIDHashed && nextProps.firebaseRef.child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId)
        && (nextProps.firebaseRef).child(`users/${nextProps.currentUserIDHashed}/match_requests`).child(nextProps.data.ventureId).on('value', snapshot => {
            //@hmm: quickly reset status
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

        this.props.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.props.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
        && (this.props.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).off();

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
                        style={[styles.profileModalUserPicture, (this.state.isFacebookFriend ? {borderWidth: 3, borderColor: '#4E598C'} : {})]}/>
                    <Text
                        style={styles.profileModalNameAgeInfo}>{this.props.data && this.props.data.firstName}, {this.props.data && this.props.data.ageRange && this.props.data.ageRange.exactVal} {'\t'}
                        | {'\t'}
                        <Text style={styles.profileModalActivityInfo}>
                            <Text
                                style={styles.profileModalActivityPreference}>{this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title && this.props.data.activityPreference.title.slice(0, -1)} </Text>:
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
                                <Text
                                    style={[styles.timerValText, (this.state.timerVal && this.state.timerVal[0] === '0' ? {color: '#F12A00'} :{})]}>{this.state.timerVal}</Text>
                            </View>
                        </Image>
                        <View style={styles.rightContainer}>
                            <Text
                                style={styles.distance}>{this.state.distance ? this.state.distance + ' mi' : ''}</Text>
                            <Text style={styles.activityPreference}>
                                {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title}
                            </Text>
                            <View>
                                {!this.props.isCurrentUser ?
                                    <View style={{top: 10}}>{this._renderStatusIcon()}</View> : <View />}
                            </View>
                        </View>
                    </LinearGradient>
                    {this.state.dir === 'column' ? profileModal : <View />}
                </View>
            </TouchableHighlight>
        );
    }
});

var CustomRefreshingIndicator = React.createClass({
    render() {
        return (
            <View style={styles.customRefreshingIndicatorContainer}>
                <Text style={styles.customRefreshingIndicatorText}>{this.props.description}</Text>
                <ActivityIndicatorIOS
                    color='#fff'
                    animating={true}
                    style={styles.customRefreshingActivityIndicatorIOS}
                    size='small'/>
            </View>
        )
    }
});

var UsersList = React.createClass({
    mixins: [TimerMixin],

    getInitialState() {
        return {
            animating: false,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            rows: [],
            searchText: '',
            showCurrentUser: false,
            showLoadingModal: true
        };
    },

    componentDidMount() {

        let currentUserRef = this.props.ventureId && this.state.firebaseRef && this.state.firebaseRef.child(`users/${this.props.ventureId}`),
            usersListRef = this.state.firebaseRef.child('users'),
            _this = this;

        this.setState({animating: true});

        // @hmm: speed up by putting fetch here

        // @hmm: short delay to allow filtering for initial loaded users list
        // also prevents RCTURLLoader equal priority error

        currentUserRef && currentUserRef.child('matchingPreferences').on('value', snapshot => {

            let matchingPreferences = snapshot.val(),
                filteredUsersArray = [];

            _this.setState({maxSearchDistance: matchingPreferences.maxSearchDistance});

            InteractionManager.runAfterInteractions(() => {

                    usersListRef.once('value', snapshot => {
                        // @hmm: clear and re-render rows
                        _this.updateRows([]);

                        // @hmm: show users based on filter settings
                        snapshot.val() && _.each(snapshot.val(), (user) => {

                            // @hmm: because of cumulative privacy selection, only have to check for friends+ for both 'friends+' and 'all'
                            if (matchingPreferences.privacy && matchingPreferences.privacy.indexOf('friends+') > -1) {
                                if (this.props.currentUserLocationCoords && user.location && user.location.coordinates && user.location.coordinates.latitude && user.location.coordinates.longitude && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude, user.location.coordinates.longitude]) <= this.state.maxSearchDistance * 1.609) {
                                    if (matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                                    if (matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                                }
                            } else if (matchingPreferences.privacy && matchingPreferences.privacy.indexOf('friends') > -1 && matchingPreferences.privacy.length === 1) {
                                if (this.props.currentUserFriends && !!_.findWhere(this.props.currentUserFriends, {name: user.name})) {
                                    if (this.props.currentUserLocationCoords && user.location && user.location.coordinates && user.location.coordinates.latitude && user.location.coordinates.longitude && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude, user.location.coordinates.longitude]) <= this.state.maxSearchDistance * 1.609) {
                                        if (matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                                        if (matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                                    }
                                }
                            } else {
                                if (this.props.currentUserLocationCoords && user.location && user.location.coordinates && user.location.coordinates.latitude && user.location.coordinates.longitude && GeoFire.distance(this.props.currentUserLocationCoords, [user.location.coordinates.latitude, user.location.coordinates.longitude]) <= this.state.maxSearchDistance * 1.609) {
                                    if (matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) > -1) filteredUsersArray.push(user);
                                    if (matchingPreferences.gender && matchingPreferences.gender.indexOf(user.gender) === -1 && matchingPreferences.gender.indexOf('other') > -1 && user.gender !== 'male' && user.gender !== 'female') filteredUsersArray.push(user);
                                }
                            }

                            _this.updateRows(_.cloneDeep(_.values(filteredUsersArray)));
                            _this.setState({
                                rows: _.cloneDeep(_.values(filteredUsersArray)),
                                currentUserRef,
                                usersListRef
                            });
                        });
                        _this.setTimeout(() => {
                            _this.updateRows(_.cloneDeep(_.values(filteredUsersArray)));
                            _this.setState({
                                rows: _.cloneDeep(_.values(filteredUsersArray)),
                                currentUserRef,
                                usersListRef
                            });

                        }, 0)

                    });
            });

        });

        this.setState({currentUserVentureId: this.props.ventureId});

        this.state.firebaseRef.child(`/users/${this.props.ventureId}`).once('value', snapshot => {
            _this.setState({currentUserData: snapshot.val(), showCurrentUser: true});
        });

    },

    _safelyNavigateToHome() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
            homeRoute = currentRouteStack[0];

        if (currentRouteStack.indexOf(homeRoute) > -1) this.props.navigator.jumpTo(homeRoute);
    },

    _safelyNavigateForward(route:{title:string, component:ReactClass<any,any,any>, passProps?:Object}) {
        let abbrevRoute = _.omit(route, 'component'),
            currentRouteStack = this.props.navigator.getCurrentRoutes();

        if(!!_.findWhere(currentRouteStack, abbrevRoute)) this.props.navigator.jumpTo(_.findWhere(currentRouteStack, abbrevRoute));
        else {
            currentRouteStack.push(route);
            this.props.navigator.immediatelyResetRouteStack(currentRouteStack)
        }
    },


    search(text:string) {
        let checkFilter = user => {
            let activity = (user.activityPreference.title).toLowerCase(),
                lowText = text.toLowerCase(),
                name = (user.firstName).toLowerCase();

            return (activity.indexOf(lowText) > -1 || name.indexOf(lowText) > -1);
        };

        this.updateRows(_.cloneDeep(_.values(_.filter(this.state.rows, checkFilter))));
    },

    shuffleUsers() {
        this.updateRows(_.shuffle(_.cloneDeep(_.values(this.state.rows))));
        this.forceUpdate();
    },

    updateRows(rows) {
        this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
        InteractionManager.runAfterInteractions(() => {
            this.setState({showLoadingModal: false});
        })
    },

    _renderCurrentUser() {
        return (
            <User backgroundColor={'rgba(255,245,226, 0.5)'}
                  data={this.state.currentUserData}
                  editable={true}
                  isCurrentUser={true}/>
        )
    },

    _renderHeader() {
        return (
            <Header>
                <HomeIcon onPress={() => this._safelyNavigateToHome()} style={{right: 14}}/>
                <TextInput
                    ref={SEARCH_TEXT_INPUT_REF}
                    autoCapitalize='none'
                    autoCorrect={true}
                    clearButtonMode='always'
                    onChangeText={(text) => this.search(text)}
                    placeholder='Search name or activity'
                    placeholderTextColor='rgba(0,0,0,0.4)'
                    returnKeyType='done'
                    style={styles.searchTextInput}/>
                <FilterModalIcon
                    onPress={() => this._safelyNavigateForward({title: 'Filters', component: Filters, sceneConfig: Navigator.SceneConfigs.FloatFromBottom, passProps: {ventureId: this.state.currentUserVentureId}})}
                    style={{left: 14}}/>
                <Text />
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
        return (
            <View style={styles.usersListBaseContainer}>
                <View>
                    {this._renderHeader()}
                    {this.state.showCurrentUser ? this._renderCurrentUser() : <View/>}
                </View>
                <RefreshableListView
                    dataSource={this.state.dataSource}
                    renderRow={this._renderUser}
                    initialListSize={INITIAL_LIST_SIZE}
                    pageSize={PAGE_SIZE}
                    minPulldownDistance={5}
                    automaticallyAdjustContentInsets={false}
                    loadData={this.shuffleUsers}
                    refreshDescription="Everyday I'm shufflin'..."
                    scrollRenderAheadDistance={600}
                    refreshingIndictatorComponent={CustomRefreshingIndicator}/>
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
                    swipeHideLength={0}>
                    <View style={styles.modalView}>
                        <Logo
                            logoContainerStyle={styles.logoContainerStyle}
                            logoStyle={styles.logoStyle}/>
                        <ActivityIndicatorIOS
                            animating={this.state.animating}
                            color='#fff'
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
    usersListBaseContainer: {
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

module.exports = UsersList;