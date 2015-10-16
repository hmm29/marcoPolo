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
var Header = require('../../Partials/Header');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var LinearGradient = require('react-native-linear-gradient');
var Logo = require('../../Partials/Logo');
var MatchedIcon = require('../../Partials/Icons/MatchedIcon');
var Modal = require('react-native-swipeable-modal');
var ReactFireMixin = require('reactfire');
var ReceivedResponseIcon = require('../../Partials/Icons/ReceivedResponseIcon');
var Swipeout = require('react-native-swipeout');

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

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};

var User = React.createClass({
    propTypes: {
        isCurrentUser: React.PropTypes.boolean,
        data: React.PropTypes.object
    },

    getInitialState() {
        return {
            dir: 'row',
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            status: ''
        }
    },

    componentWillMount() {
        let _this = this;

            this.state.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.state.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
            && (this.state.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).once('value', snapshot => {
                _this.setState({status: snapshot.val() && snapshot.val().status});
            });
    },

    componentWillReceiveProps(nextProps) {

        let _this = this;

        this.state.firebaseRef && this.props.data && this.props.data.ventureId && this.props.currentUserIDHashed && this.state.firebaseRef.child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId)
        && (this.state.firebaseRef).child(`users/${this.props.currentUserIDHashed}/match_requests`).child(this.props.data.ventureId).once('value', snapshot => {
            _this.setState({status: snapshot.val() && snapshot.val().status});
        });
    },

    componentWillUnmount() {
        let currentUserIDHashed = this.props.currentUserIDHashed,
            firebaseRef = this.props.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/match_requests');

        currentUserMatchRequestsRef && currentUserMatchRequestsRef.off();
    },

    calculateDistance(pt1:Object, pt2:Object) {
        if (!pt1) {
            return '';
        }
        var lon1 = Number(pt1.longitude),
            lat1 = Number(pt1.latitude),
            lon2 = pt2[0],
            lat2 = pt2[1];
        var dLat = this.numberToRadius(lat2 - lat1),
            dLon = this.numberToRadius(lon2 - lon1),
            a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(this.numberToRadius(lat1))
                * Math.cos(this.numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return ((6371 * c) * 1000 * 0.000621371).toFixed(1); // returns miles
    },

    _getSecondaryStatusColor() {
        if(this.props.isCurrentUser) return '#FBFBF1';

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

    handleMatchInteraction() {
        // @hmm: use hashed targetUserID as key for Firebase database

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
            }, 100);

            currentUserMatchRequestsRef.child(targetUserIDHashed).setWithPriority({
                status: 'matched',
            }, 100);
        }

        else if (this.state.status === 'matched') {
            let distance = 0.7 + ' mi';

            let chatRoomRef = firebaseRef.child('chat_rooms/' + currentUserIDHashed + '_TO_' + targetUserIDHashed);

            chatRoomRef.child('timer').set({value: 300000}); // set timer

            currentUserMatchRequestsRef && currentUserMatchRequestsRef.child(targetUserIDHashed).off();

            chatRoomRef.once('value', snapshot => {
                if(snapshot.val() && _.last(_this.props.navigator.getCurrentRoutes()).title === 'Chat') _this.props.navigator.jumpForward();
                else {
                    _this.props.navigator.push({
                        title: 'Chat',
                        component: Chat,
                        passProps: {
                            recipient: _this.props.data,
                            distance,
                            chatRoomRef,
                            currentUserData: _this.props.currentUserData
                        }
                    });
                }
            })

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

    numberToRadius(number:number) {
        return number * Math.PI / 180;
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

        let distance, profileModal, swipeoutBtns;

        if (!this.props.currentUser && this.props.currentPosition) distance = 0.7 + 'mi';
        //this.calculateDistance(this.props.currentPosition.coords, this.props.data.location.coordinates) + ' mi'

        if (!this.props.isCurrentUser)
            swipeoutBtns = [
                {
                    text: 'Report', backgroundColor: '#4f535e'
                },
                {
                    text: 'Block', backgroundColor: '#1d222f', color: '#fff'
                }
            ];

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

        return (
            <Swipeout right={swipeoutBtns}>
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
                                style={styles.thumbnail}/>
                            <View style={styles.rightContainer}>
                                <Text style={styles.distance}>{distance}</Text>
                                <Text style={styles.activityPreference}>
                                    {this.props.data && this.props.data.activityPreference && this.props.data.activityPreference.title}
                                </Text>
                                <View>
                                    {!this.props.isCurrentUser ?
                                        <View style={{top: 10}}>{this._renderStatusIcon()}</View> : <View />}
                                </View>
                            </View>
                        </LinearGradient>
                        {this.state.dir === 'column' ? profileModal: <View />}
                    </View>
                </TouchableHighlight>
            </Swipeout>
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
            currentPosition: null,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            firebaseRef,
            userRows: [],
            searchText: '',
            showLoadingModal: true,
            usersListRef
        };
    },

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
            let usersListRef = this.state.firebaseRef.child('/users'), _this = this;

            this.bindAsArray(usersListRef, 'userRows');

            AsyncStorage.getItem('@AsyncStorage:Venture:account')
                .then((account: string) => {
                    account = JSON.parse(account);

                    // @hmm: sweet! order alphabetically to sort with priority ('matched' --> 'received' --> 'sent')

                    usersListRef.on('value', snapshot => {
                        _this.updateRows(_.sortBy(_.cloneDeep(_.values(snapshot.val())), `match_requests.${account.ventureId}.status`));
                        _this.setState({rows: _.cloneDeep(_.values(snapshot.val())), usersListRef});
                    });

                    this.setState({currentUserVentureId: account.ventureId})

                    this.state.firebaseRef.child(`/users/${account.ventureId}`).once('value', snapshot => {
                        _this.setState({currentUserData: snapshot.val()});
                    });
                })
                .then(() => {
                    InteractionManager.runAfterInteractions(() => {
                        navigator.geolocation.getCurrentPosition(
                            (currentPosition) => {
                                _this.setState({currentPosition});
                            },
                            (error) => {
                                console.error(error);
                            },
                            {enableHighAccuracy: true, timeout: 1000, maximumAge: 1000}
                        );
                    });
                })
                .catch((error) => console.log(error.message))
                .done();
        });
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
        })
    },
    _renderHeader() {
        return (
            <Header containerStyle={{position: 'relative'}}>
                <HomeIcon onPress={() => this._safelyNavigateToHome()}/>
                <FilterModalIcon
                    onPress={() => this._safelyNavigateForward({title: 'Filters', component: Filters, sceneConfig: Navigator.SceneConfigs.FloatFromBottom, passProps: {ventureId: this.state.currentUserVentureId}})}/>
            </Header>
        )
    },


    _renderUser(user:Object, sectionID:number, rowID:number) {
        // @hmm: only users with extant interactions
        if (user.ventureId === this.state.currentUserVentureId) return <View />;

        return <User currentUserData={this.state.currentUserData}
                     currentUserIDHashed={this.state.currentUserVentureId}
                     currentPosition={this.state.currentPosition}
                     data={user}
                     firebaseRef={this.state.firebaseRef}
                     navigator={this.props.navigator} />;
    },

    render() {
        return (
            <View style={styles.usersListBaseContainer}>
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
        width: 50,
        height: 50,
        borderRadius: 25,
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


module.exports = ChatsList;