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
    Settings,
    StyleSheet,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    View
    } = React;

var _ = require('lodash');
var ChatsList = require('./ChatsList');
var ChevronIcon = require('../../Partials/Icons/ChevronIcon');
var Display = require('react-native-device-display');
var DDPClient = require('ddp-client');
var Firebase = require('firebase');
var Header = require('../../Partials/Header');
var Home = require('../Home');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var LinearGradient = require('react-native-linear-gradient');
var Logo = require('../../Partials/Logo');
var Modal = require('react-native-swipeable-modal');
var RefreshableListView = require('react-native-refreshable-listview');
var Swipeout = require('react-native-swipeout');
var TimerMixin = require('react-timer-mixin');

var INITIAL_LIST_SIZE = 8;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var PAGE_SIZE = 8;
var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;
var YELLOW_HEX_CODE = '#ffe770';
var BLUE_HEX_CODE = '#40cbfb';
var GREEN_HEX_CODE = '#84FF9B';
var WHITE_HEX_CODE = '#fff';

String.prototype.capitalize = function () {
    return this.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
};

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

var UsersList = React.createClass({
    mixins: [TimerMixin],

    subscriptionID: null,

    watchID: null,

    getInitialState() {
        return {
            animating: true,
            currentPosition: null,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            ddpClient: new DDPClient({
                ssl: true,
                url: 'wss://lb1.ventureappofficial.me/websocket'
            }),
            firebaseRef: null,
            isModalShow: true,
            loaded: false,
            matchInteractions: {},
            searchText: this.props.searchText,
            showCurrentUser: false
        };
    },

    componentWillMount() {
        this.setTimeout(() => {
            this.setState({animating: false, isModalShow: false, showCurrentUser: true});
        }, 2200);
    },

    componentDidMount() {
        var ddpClient = this.state.ddpClient,
            firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/'),
            _this = this;

            this.setTimeout(() => {
                ddpClient.connect((err, wasReconnect) => {
                    _this.setState({firebaseRef, loaded: true});
                    _this.subscriptionID = ddpClient.subscribe('accounts');

                    var accountsCollectionObserver = ddpClient.observe('accounts');
                    accountsCollectionObserver.added = () => _this.updateRows(_.cloneDeep(_.values(ddpClient.collections.accounts)));
                    accountsCollectionObserver.changed = () => _this.updateRows(_.cloneDeep(_.values(ddpClient.collections.accounts)));
                    accountsCollectionObserver.removed = () => _this.updateRows(_.cloneDeep(_.values(ddpClient.collections.accounts)));
                });

                navigator.geolocation.getCurrentPosition(
                    (currentPosition) => {
                        this.setState({currentPosition});
                    },
                    (error) => {
                        console.error(error);
                    },
                    {enableHighAccuracy: true, timeout: 1000, maximumAge: 1000}
                );

                this.watchID = navigator.geolocation.watchPosition((currentPosition) => {
                    this.setState({currentPosition});
                })

                AsyncStorage.getItem('@AsyncStorage:Venture:account')
                    .then((account) => {
                        account = JSON.parse(account);
                        if (account)
                            _this.setState({
                                currentUserIDHashed: account.ventureId,
                                currentUserActivityPreference: account.activityPreference,
                                currentUserFirstName: account.name.split(' ')[0],
                                currentUserAccountID: account._id,
                                currentUserProfilePic: account.picture
                            });
                    })
                    .catch((error) => console.log(error.message))
                    .done();
            }, 800);
    },

    handleMatchInteractionsStateChange(matchInteractions:Object) {
        this.setState({matchInteractions});
    },

    shuffleUsers() {
        this.updateRows(_.cloneDeep(_.values(_.shuffle(this.state.ddpClient.collections.accounts))));
    },

    updateRows(rows) {
        this.setState({dataSource: this.state.dataSource.cloneWithRows(rows)});
    },

    componentDidUnMount() {
    },

    _renderCurrentUser() {
        return (
            <User backgroundColor='rgba(255,245,226, 0.5)'
                  editable={true}
                  isNotCurrentUser={false}
                  user={{activityPreference: this.state.currentUserActivityPreference, picture: this.state.currentUserProfilePic}}/>
        )
    },

    _renderHeader() {
        return (
            <Header containerStyle={{position: 'relative'}}>
                <HomeIcon onPress={() => this.props.navigator.pop()}/>
                <TextInput
                    autoCapitalize='none'
                    autoCorrect={true}
                    clearButtonMode='always'
                    onChangeText={(text) => this.search(text)}
                    placeholder='Search name or tag'
                    placeholderTextColor='rgba(0,0,0,0.4)'
                    returnKeyType='done'
                    style={styles.searchTextInput}/>
            </Header>
        )
    },


    _renderUser(user:Object, sectionID:number, rowID:number) {
        if (user.firstName === this.state.currentUserFirstName) return <View />;

        return <User
            currentUserActivityPreference={this.state.currentUserActivityPreference}
            currentUserBio={this.state.currentUserBio}
            currentUserFirstName={this.state.currentUserFirstName}
            currentUserIDHashed={this.state.currentUserIDHashed}
            currentUserProfilePic={this.state.currentUserProfilePic}
            firebaseRef={this.state.firebaseRef}
            handleMatchInteractionsStateChange={this.handleMatchInteractionsStateChange}
            isNotCurrentUser={true}
            matchInteractions={this.state.matchInteractions}
            navigator={this.props.navigator}
            position={this.state.currentPosition}
            rowID={rowID}
            sectionID={sectionID}
            user={user}/>;
    },

    componentWillUnmount: function () {
        if (navigator.geolocation) navigator.geolocation.clearWatch(this.watchID);
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
                    automaticallyAdjustContentInsets={false}
                    loadData={this.shuffleUsers}
                    refreshDescription="Everyday I'm shufflin..."
                    scrollRenderAheadDistance={2000}
                    refreshingIndictatorComponent={CustomRefreshingIndicator}/>
                <View style={{height: 48}}></View>
                <Modal
                    height={SCREEN_HEIGHT}
                    modalStyle={styles.loadingModalStyle}
                    isVisible={this.state.isModalShow}
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


var User = React.createClass({
    getInitialState() {
        return {
            dir: 'row',
            status: '',
            statusColor: WHITE_HEX_CODE
        }
    },

    mixins: [TimerMixin],

    propTypes: {
        firebaseRef: React.PropTypes.any,
        currentUserActivityPreference: React.PropTypes.string,
        currentUserBio: React.PropTypes.string,
        currentUserFirstName: React.PropTypes.string,
        currentUserIDHashed: React.PropTypes.string,
        currentUserProfilePic: React.PropTypes.string,
        editable: React.PropTypes.bool,
        handleMatchInteractionsStateChange: React.PropTypes.func,
        isNotCurrentUser: React.PropTypes.bool,
        matchInteractions: React.PropTypes.object,
        navigator: React.PropTypes.object,
        position: React.PropTypes.object,
        rowID: React.PropTypes.string,
        sectionID: React.PropTypes.string,
        user: React.PropTypes.object
    },

    componentWillMount() {
        var targetUserIDHashed = this.props.user.ventureId,
            currentUserIDHashed = this.props.currentUserIDHashed,
            matchInteractions = this.props.matchInteractions,
            firebaseRef = this.props.firebaseRef,
            currentUserRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
            _this = this;

        currentUserRef && currentUserRef.child(targetUserIDHashed).on('value', function (snapshot) {
            _this.setState({status: snapshot.val() && snapshot.val().status});

            if (snapshot.val() && snapshot.val().status === 'sent') _this.setState({statusColor: YELLOW_HEX_CODE});
            if (snapshot.val() && snapshot.val().status === 'received') _this.setState({statusColor: BLUE_HEX_CODE});
            if (snapshot.val() && snapshot.val().status === 'matched') _this.setState({statusColor: GREEN_HEX_CODE});

            matchInteractions[targetUserIDHashed] = {status: snapshot.val() && snapshot.val().status};
            _this.props.handleMatchInteractionsStateChange({matchInteractions});
        });
    },

    componentWillReceiveProps(nextProps) {

        if ((this.props.user.ventureId !== nextProps.user.ventureId) || (this.props.matchInteractions !== nextProps.matchInteractions)) {
            var targetUserIDHashed = nextProps.user.ventureId,
                currentUserIDHashed = nextProps.currentUserIDHashed,
                firebaseRef = nextProps.firebaseRef,
                currentUserRef = firebaseRef && firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
                _this = this;

            // make sure to reset state

            _this.setState({status: '', statusColor: WHITE_HEX_CODE});

            currentUserRef && currentUserRef.child(targetUserIDHashed).once('value', function (snapshot) {
                _this.setState({status: snapshot.val() && snapshot.val().status});

                if (snapshot.val() && snapshot.val().status === null) _this.setState({statusColor: WHITE_HEX_CODE});
                if (snapshot.val() && snapshot.val().status === 'sent') _this.setState({statusColor: YELLOW_HEX_CODE});
                if (snapshot.val() && snapshot.val().status === 'received') _this.setState({statusColor: BLUE_HEX_CODE});
                if (snapshot.val() && snapshot.val().status === 'matched') _this.setState({statusColor: GREEN_HEX_CODE});
            });
        }
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
        switch (this.state.statusColor) {
            case WHITE_HEX_CODE:
                return '#FBFBF1';
            case YELLOW_HEX_CODE:
                return '#FFF9B9';
            case BLUE_HEX_CODE:
                return '#D1F8FF';
            case GREEN_HEX_CODE:
                return '#AAFFA9';
        }
    },

    _getGradientColors() {
        if (this.props.backgroundColor) return [this.props.backgroundColor, this.props.backgroundColor];
        return [this.state.statusColor, this._getSecondaryStatusColor(), WHITE_HEX_CODE, 'transparent']
    },

    handleMatchInteraction() {
        // @hmm: use hashed targetUserID as key for Firebase database

        var targetUserIDHashed = this.props.user.ventureId,
            currentUserIDHashed = this.props.currentUserIDHashed,
            matchInteractions = this.props.matchInteractions,
            firebaseRef = this.props.firebaseRef,
            targetUserRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests'),
            currentUserRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
            _this = this;

        currentUserRef.child(targetUserIDHashed).on('value', function (snapshot) {
            _this.setState({status: snapshot.val() && snapshot.val().status});

            if (snapshot.val() && snapshot.val().status === null) _this.setState({statusColor: WHITE_HEX_CODE});
            if (snapshot.val() && snapshot.val().status === 'sent') _this.setState({statusColor: YELLOW_HEX_CODE});
            if (snapshot.val() && snapshot.val().status === 'received') _this.setState({statusColor: BLUE_HEX_CODE});
            if (snapshot.val() && snapshot.val().status === 'matched') _this.setState({statusColor: GREEN_HEX_CODE});

            matchInteractions[targetUserIDHashed] = {status: snapshot.val() && snapshot.val().status};

            _this.props.handleMatchInteractionsStateChange({matchInteractions});
        });

        if (_this.state.status) {

            if (_this.state.status === 'sent') {

                _this.setState({statusColor: WHITE_HEX_CODE});

                // @hmm: the chatroom reference uses id of the user who accepts the received matchInteraction

                targetUserRef.child(currentUserIDHashed).set(null);
                currentUserRef.child(targetUserIDHashed).set(null);

                // @hmm: delete the request
            }

            if (_this.state.status === 'received') {

                // @hmm: the chatroom reference uses id of the user who accepts the received matchInteraction

                var chatRoomRef = firebaseRef.child('chat_rooms/' + currentUserIDHashed + '_TO_' + targetUserIDHashed);

                targetUserRef.child(currentUserIDHashed).set({
                    status: 'matched',
                    chatRoomRefStr: currentUserIDHashed
                });
                currentUserRef.child(targetUserIDHashed).set({
                    status: 'matched',
                    chatRoomRefStr: currentUserIDHashed
                });

                // @hmm: accept request
            }

            if (_this.state.status === 'matched') {
                var ChatsList = require('./ChatsList'),
                    distance = _this.calculateDistance(_this.props.currentPosition.coords, _this.props.user.location.coordinates) + ' mi';

                var chatRoomRefStr = firebaseRef.child('chat_rooms/' + currentUserIDHashed + '_TO_' + targetUserIDHashed),
                    chatRoomTimerRefStr = chatRoomRefStr.child('timer').set({value: 300000});

                currentUserRef && currentUserRef.child(targetUserIDHashed).off();

                this.props.navigator.push({
                    title: 'ChatsListPage',
                    component: ChatsList,
                    passProps: {
                        recipient: _this.props.user,
                        currentUserIDHashed,
                        distance,
                        chatRoomRefStr,
                        chatRoomTimerRefStr,
                        currentUser: {
                            picture: this.props.currentUserProfilePic,
                            activityPreference: this.props.currentUserActivityPreference,
                            bio: this.props.currentUserBio
                        }
                    }
                });
                // @kp: push chat room onto view
            }

        } else {
            targetUserRef.child(currentUserIDHashed).set({
                status: 'received'
            });
            currentUserRef.child(targetUserIDHashed).set({
                status: 'sent'
            });
        }
    },

    numberToRadius(number:number) {
        return number * Math.PI / 180;
    },

    _onPressItem() {
        var config = layoutAnimationConfigs[0];
        LayoutAnimation.configureNext(config);

        var _this = this;

        InteractionManager.runAfterInteractions(() => {
            _this.setState({dir: this.state.dir === 'row' ? 'column' : 'row'});
        });
    },

    _renderStatusIcon() {
        switch (this.state.statusColor) {
            case WHITE_HEX_CODE:
                return <ChevronIcon
                    color='rgba(0,0,0,0.2)'
                    direction='right'
                    onPress={() => this.handleMatchInteraction()}/>
            case YELLOW_HEX_CODE:
                return <AwaitingResponseIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={() => this.handleMatchInteraction()}/>
            case BLUE_HEX_CODE:
                return <ReceivedResponseIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={() => this.handleMatchInteraction()}/>
            case GREEN_HEX_CODE:
                return <MatchedIcon
                    color='rgba(0,0,0,0.2)'
                    onPress={() => this.handleMatchInteraction()}/>
        }
    },

    render() {
        let distance, swipeoutBtns, user = this.props.user;

        if (this.props.position) distance = this.calculateDistance(this.props.position.coords, user.location.coordinates) + ' mi';

        if (this.props.isNotCurrentUser)
            swipeoutBtns = [
                {
                    text: 'Report', backgroundColor: '#4f535e'
                },
                {
                    text: 'Block', backgroundColor: '#1d222f', color: '#fff'
                }
            ];

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
                            colors={this._getGradientColors()}
                            start={[0,1]}
                            end={[1,1]}
                            locations={[0.3,0.99,1.0]}
                            style={styles.container}>
                            <Image
                                onPress={this._onPressItem}
                                source={{uri: 'https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,e_volume,q_63,w_64/v1442205643/Alex%20Borsa.png'}}
                                style={styles.thumbnail}/>
                            <View style={styles.rightContainer}>
                                <Text style={styles.distance}>{distance}</Text>
                                <Text style={styles.activityPreference}>
                                    {user.activityPreference && (user.activityPreference).toUpperCase() + '?'}
                                </Text>
                                <View>
                                    {this.props.isNotCurrentUser ? this._renderStatusIcon() : <View />}
                                </View>
                            </View>
                        </LinearGradient>
                        {this.state.dir === 'column' ? <ProfileModal
                            activityPreference={user.activityPreference}
                            bio={user.bio}
                            firstName={user.firstName}
                            picture={user.picture} /> : <View />}
                    </View>
                </TouchableHighlight>
            </Swipeout>
        );
    }
});

type Props = {
    activityPreference: React.PropTypes.string,
    bio: React.PropTypes.string,
    firstName: React.PropTypes.string,
    getSecondaryStatusColor: React.PropTypes.func,
    onPressItem: React.PropTypes.func,
    picture: React.PropTypes.string,
    statusColor: React.PropTypes.string,
    tags: React.PropTypes.array
}

class ProfileModal extends React.Component {
    props:Props;

    render():ReactElement {
        return (
            <View style={styles.profileModalContainer}>
                <View
                    style={[styles.profileModal, {backgroundColor: this.props.statusColor}]}>
                        <Image
                            source={{uri: 'https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,e_volume,q_83,w_240/v1442205643/Alex%20Borsa.png'}}
                            style={styles.profileModalUserPicture}/>
                    <Text
                        style={styles.profileModalNameAgeInfo}>{this.props.firstName}, 21 {'\t'} | {'\t'}
                        <Text style={styles.profileModalActivityInfo}>
                            <Text
                                style={styles.profileModalActivityPreference}>{this.props.activityPreference && this.props.activityPreference.capitalize()}</Text>:
                            1 PM {'\n'}
                        </Text>
                    </Text>
                    <View style={[styles.tagBar, {bottom: 10}]}>
                        <Text
                            style={styles.profileModalSectionTitle}>TAGS: </Text>
                        {['food', 'corn'].map((tag, i) => (
                            <TouchableOpacity key={i} style={styles.tag}><Text
                                style={styles.tagText}>{tag}</Text></TouchableOpacity>
                        ))
                        }
                    </View>
                    <Text
                        style={styles.profileModalBio}>{this.props.bio}</Text>
                </View>
            </View>
        )
    }
}

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
        color: '#fff'
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
        flex: 1,
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
    },
});


module.exports = UsersList;