/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Chat
 * @flow
 */

'use strict';

var React = require('react-native');

var {
    AppStateIOS,
    Image,
    InteractionManager,
    LayoutAnimation,
    ListView,
    Navigator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    } = React;

var _ = require('lodash');
var Display = require('react-native-device-display');
var Firebase = require('firebase');
var Header = require('../Partials/Header');
var { Icon, } = require('react-native-icons');
var LinearGradient = require('react-native-linear-gradient');
var ReactFireMixin = require('reactfire');
var TimerMixin = require('react-timer-mixin');

var INITIAL_TIMER_VAL_IN_MS = 300000;
var SCREEN_HEIGHT = Display.height;
var SCREEN_WIDTH = Display.width;
var MESSAGE_TEXT_INPUT_REF = 'messageTextInput';

let compoundStyles = () => {
    let res = {};
    for (var i = 0; i < arguments.length; ++i) {
        if (arguments[i]) {
            Object.assign(res, arguments[i]);
        }
    }
    return res;
};

var Chat = React.createClass({

    mixins: [ReactFireMixin, TimerMixin],

    getInitialState() {
        return {
            chatRoomMessagesRef: null,
            contentOffsetYValue: 0,
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }),
            hasKeyboardSpace: false,
            loaded: false,
            message: '',
            messageList: Object
        };
    },

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            let chatRoomMessagesRef = this.props.passProps.chatRoomRef.child('messages'), _this = this;

            this.bindAsObject(chatRoomMessagesRef, 'messageList');

            chatRoomMessagesRef.on('value', (snapshot) => {
                _this.setState({
                    contentOffsetYValue: 0,
                    message: '',
                    messageList: snapshot.val() && _.cloneDeep(_.values(snapshot.val()))
                });
                _this.updateMessages(_.cloneDeep(_.values(snapshot.val())))
            });

            this.setState({chatRoomMessagesRef});
        });
    },

    containerTouched(event) {
        this.refs[MESSAGE_TEXT_INPUT_REF].blur();
        return false;
    },

    updateMessages(messages:Array<Object>) {
        this.setState({
            dataSource: new ListView.DataSource({
                rowHasChanged: (row1, row2) => !_.isEqual(row1, row2)
            }).cloneWithRows(messages),
            loaded: true
        });
    },

    _renderHeader() {
        return (
            <Header containerStyle={{backgroundColor: '#040A19'}}>
                <TouchableOpacity onPress={this._safelyNavigateToMainLayout} style={{right: 10, bottom: 5}}>
                    <Icon
                        color="#fff"
                        name="ion|ios-arrow-thin-left"
                        size={36}
                        style={{width: 38, height: 38}}
                        />
                </TouchableOpacity>
                <Text
                    style={styles.activityPreferenceTitle}>
                    {this.props.passProps.currentUserData.activityPreference.title && this.props.passProps.currentUserData.activityPreference.title.toUpperCase() + '?'} </Text>
                <Text />
            </Header>
        );
    },

    _renderMessage(message:Object) {
        var recipient = this.props.passProps.recipient,
            currentUserData = this.props.passProps.currentUserData,
            currentUserIDHashed = this.props.passProps.currentUserData.ventureId,
            messageRowStyle = styles.receivedMessageRow,
            messageTextStyle = styles.receivedMessageText,
            sentByCurrentUser = (message.senderIDHashed === currentUserIDHashed);

        if (!sentByCurrentUser) {
            messageRowStyle = styles.sentMessageRow;
            messageTextStyle = styles.sentMessageText;
        }

        var avatarImage = (!sentByCurrentUser) ? recipient.picture : currentUserData.picture;

        var space = (
            <Image
                source={{uri: avatarImage}}
                style={styles.recipientAlign}/>
        );
        return (
            <LinearGradient
                colors={(!sentByCurrentUser) ? ['#124B8F', '#2C90C8', '#fff'] : ['#fff', '#fff']}
                start={[0,1]}
                end={[1,0.9]}
                locations={[0,1.0,0.9]}
                style={styles.messageRow}>
                { (!sentByCurrentUser) ? space : null }
                <View style={messageRowStyle}>
                    <Text style={styles.baseText}>
                        <Text style={messageTextStyle}>
                            {message.body}
                        </Text>
                    </Text>
                </View>
                { (sentByCurrentUser) ? space : null }
            </LinearGradient>
        );
    },

    _safelyNavigateToMainLayout() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
        // @hmm navigate back to main layout component
            mainLayoutRoute = _.findLast(currentRouteStack, (route) => {
                return route && route.passProps && !! route.passProps.selected;
            });

        if(mainLayoutRoute) this.props.navigator.jumpTo(mainLayoutRoute)
        else this.props.navigator.jumpBack();
    },

    _sendMessage() {
        var _this = this;

        var messageObj = {
            senderIDHashed: this.props.passProps.currentUserData.ventureId,
            body: this.state.message
        };
        this.state.chatRoomMessagesRef.push(messageObj);
        this.state.chatRoomMessagesRef.once('value', (snapshot) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            _this.setState({
                contentOffsetYValue: 0,
                message: ''
            });
            _this.updateMessages(_.cloneDeep(_.values(snapshot.val())));
            _this.refs[MESSAGE_TEXT_INPUT_REF].blur();
        });
    },

    render() {
        return (
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.96)'}}>
                <View>
                    {this._renderHeader()}
                </View>
                <View onStartShouldSetResponder={this.containerTouched} style={styles.container}>
                    <RecipientInfoBar chatRoomRef={this.props.passProps.chatRoomRef}
                                      closeDropdownProfile={this.state.closeDropdownProfile}
                                      _id={this.props.passProps._id}
                                      navigator={this.props.navigator}
                                      recipientData={this.props.passProps}
                                      safelyNavigateToMainLayout={this._safelyNavigateToMainLayout}
                        />
                    <ListView
                        contentOffset={{x: 0, y: this.state.contentOffsetYValue}}
                        dataSource={this.state.dataSource}
                        renderRow={this._renderMessage}
                        initialListSize={15}
                        pageSize={15}
                        scrollsToTop={false}
                        automaticallyAdjustContentInsets={false}
                        style={{backgroundColor: 'rgba(0,0,0,0.01)', width: SCREEN_WIDTH}}
                        />
                    <View>
                        <View
                            style={[styles.textBoxContainer, {marginBottom: this.state.hasKeyboardSpace ? SCREEN_HEIGHT/3.1 : 0}]}>
                            <TextInput
                                ref={MESSAGE_TEXT_INPUT_REF}
                                onBlur={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({hasKeyboardSpace: false, closeDropdownProfile: false})
                    }}
                                onFocus={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({hasKeyboardSpace: true, closeDropdownProfile: true})
                    }}
                                multiline={true}
                                style={{width: SCREEN_WIDTH/1.2, backgroundColor: 'rgba(255,255,255,0.75)', height: 30, paddingLeft: 10, borderColor: 'gray', borderRadius: 10, fontFamily: 'AvenirNext-Regular', color: '#111', borderWidth: 1, margin: SCREEN_WIDTH/35}}
                                onChangeText={(text) => this.setState({message: text})}
                                value={this.state.message}
                                returnKeyType='default'
                                keyboardType='default'
                                />
                            <TouchableOpacity onPress={() => {
                        if(this.state.message.length) this._sendMessage();
                        else this.refs[MESSAGE_TEXT_INPUT_REF].blur();
                    }}>
                                <Text
                                    style={{color: 'white', fontFamily: 'AvenirNextCondensed-Regular', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3}}>Send</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    }
});

var RecipientInfoBar = React.createClass({
    propTypes: {
        chatRoomRef: React.PropTypes.string.isRequired,
        closeDropdownProfile: React.PropTypes.bool.isRequired,
        _id: React.PropTypes.string.isRequired,
        navigator: React.PropTypes.object,
        recipientData: React.PropTypes.object.isRequired,
        safelyNavigateToMainLayout: React.PropTypes.func.isRequired
    },

    getInitialState() {
        return {
            activity: this.props.recipientData.currentUserData.activityPreference.title,
            age: _.random(19, 23),
            dir: 'row',
            hasKeyboardSpace: false,
            infoContent: 'recipient',
            time: '2'
        }
    },

    componentDidMount() {
        console.log('Mounted Chat Info Bar');
    },

    render(){
        let currentUserData = this.props.recipientData.currentUserData,
            recipient = this.props.recipientData.recipient,
            tags = (this.state.infoContent === 'recipient' ? recipient.activityPreference.tags : currentUserData.activityPreference.tags),
            user = (this.state.infoContent === 'recipient' ? recipient : currentUserData);

        let infoContent = (
            <View
                style={{paddingVertical: (user === recipient ? SCREEN_HEIGHT/40 : SCREEN_HEIGHT/97), bottom: (this.state.hasKeyboardSpace ? SCREEN_HEIGHT/3.5 : 0), backgroundColor: '#eee', flexDirection: 'column', justifyContent: 'center'}}>
                <Image source={{uri: user.picture}}
                       style={{width: SCREEN_WIDTH/1.8, height: SCREEN_WIDTH/1.8, borderRadius: SCREEN_WIDTH/3.6, alignSelf: 'center', marginVertical: SCREEN_WIDTH/18}}/>
                <Text
                    style={{color: '#222', fontSize: 20, fontFamily: 'AvenirNextCondensed-Medium', textAlign: 'center'}}>
                    {user.firstName}, {user.ageRange && user.ageRange.exactVal} {'\t'} |{'\t'}
                    <Text style={{fontFamily: 'AvenirNextCondensed-Medium'}}>
                        <Text
                            style={{fontSize: 20}}>{user === currentUserData ? this.state.activity && this.state.activity : user.activityPreference && user.activityPreference.title && user.activityPreference.title.capitalize().slice(0, -1)}</Text>: {user.activityPreference && (user.activityPreference.start.time || user.activityPreference.status)}
                        {'\n'}
                    </Text>
                </Text>
                {user === currentUserData ? <TextInput
                    onBlur={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({hasKeyboardSpace: false})
                        }}
                    onFocus={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({hasKeyboardSpace: true})
                        }}
                    autoCapitalize='none'
                    autoCorrect={false}
                    onChangeText={(text) => {
                            this.setState({activity: text});
                        }}
                    maxLength={15}
                    returnKeyType='default'
                    style={styles.textInput}
                    value={this.state.activity}/> : <TextInput />}
                <View style={[styles.tagBar, {bottom: 10}]}>
                    <Text style={styles.tagsTitle}>TAGS: </Text>
                    {tags && tags.map((tag) => (
                        <TouchableOpacity style={styles.tag}><Text
                            style={styles.tagText}>{tag}</Text></TouchableOpacity>
                    ))
                    }
                </View>
                <Text
                    style={{color: '#222', fontFamily: 'AvenirNextCondensed-Medium', textAlign: 'center', fontSize: 16, marginTop: 15}}>{user.bio || 'Yale \'16'}</Text>
            </View>
        );

        return (
            <View style={{flexDirection: 'column', width: SCREEN_WIDTH}}>
                <View style={styles.recipientBar}>
                    <RecipientAvatar onPress={() => {
                    var config = layoutAnimationConfigs[0];
                    LayoutAnimation.configureNext(config);
                    this.setState({infoContent: 'recipient', dir: (this.state.dir === 'column' && this.state.infoContent === 'recipient' ? 'row' : 'column')})
                }} navigator={this.props.navigator} recipient={recipient}/>
                    <View style={styles.rightContainer}>
                        <Text style={styles.recipientDistance}> {this.props.recipientData.distance} </Text>
                    </View>

                    <RecipientAvatar onPress={() => {
                    var config = layoutAnimationConfigs[0];
                    LayoutAnimation.configureNext(config);
                   this.setState({infoContent: 'currentUser', dir: (this.state.dir === 'column' && this.state.infoContent === 'currentUser' ? 'row' : 'column')})
                }} navigator={this.props.navigator} currentUserActivityPreference={this.state.activity}
                                     currentUserData={currentUserData} style={{marginRight: 20}}/>
                </View>
                <TimerBar chatRoomRef={this.props.chatRoomRef}
                          currentUserData={currentUserData}
                          _id={this.props._id}
                          navigator={this.props.navigator}
                          recipient={recipient}
                          safelyNavigateToMainLayout={this.props.safelyNavigateToMainLayout}
                    />
                {this.state.dir === 'column' ?
                    <View style={{backgroundColor: '#fff'}}>
                        {infoContent}
                    </View> :
                    <View />
                }
            </View>
        );
    }
});


var RecipientAvatar = React.createClass({
    propTypes: {
        onPress: React.PropTypes.func,
        currentUserData: React.PropTypes.object,
        currentUserActivityPreference: React.PropTypes.string,
        recipient: React.PropTypes.object,
        safelyNavigateToMainLayout: React.PropTypes.func.isRequired
    },

    render() {
        let currentUserData = this.props.currentUserData,
            recipient = this.props.recipient,
            user;

        if (this.props.recipient) user = {firstName: recipient.firstName, picture: recipient.picture}
        else user = {firstName: currentUserData.firstName, picture: currentUserData.picture}

        return (
            <TouchableOpacity onPress={this.props.onPress} style={styles.recipientAvatar}>
                <Image
                    source={{uri: user.picture}}
                    style={styles.avatarImage}/>
                <Text
                    style={styles.avatarActivityPreference}> {user.firstName} </Text>
            </TouchableOpacity>
        );
    }
});

var TimerBar = React.createClass({
    propTypes: {
        chatRoomRef: React.PropTypes.string.isRequired,
        currentUserData: React.PropTypes.object.isRequired,
        _id: React.PropTypes.string.isRequired,
        navigator: React.PropTypes.object.isRequired,
        recipient: React.PropTypes.object.isRequired,
        safelyNavigateToMainLayout: React.PropTypes.func.isRequired
    },

    getInitialState() {
        return {
            activeToBackgroundTimeRecordInMs: null,
            currentAppState: AppStateIOS.currentState,
            _id: React.PropTypes.string.isRequired,
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            previousAppState: null,
            timerValInMs: INITIAL_TIMER_VAL_IN_MS
        }
    },

    mixins: [TimerMixin],

    _handle: null,

    componentWillMount() {
        InteractionManager.runAfterInteractions(() => {
            let chatRoomRef = this.props.chatRoomRef,
                currentUserData = this.props.currentUserData,
                firebaseRef = this.state.firebaseRef,
                recipient = this.props.recipient,
                _this = this;

                chatRoomRef.child('createdAt').once('value', snapshot => {

                if (snapshot.val() === null) {
                    console.log('Chat created and timer started');
                    chatRoomRef.child('createdAt').set((new Date()) + '');

                    _this.handle = _this.setInterval(() => {
                        _this.setState({timerValInMs: this.state.timerValInMs - 1000});
                        chatRoomRef.child('timer').set({value: this.state.timerValInMs});

                        if (this.state.timerValInMs <= 1000) {
                            _this.clearInterval(_this.handle);

                            //TODO: give each chat and its route a globally unique ID
                            // Find in route stack, delete, and reset the route stack

                            this._destroyChatroom(chatRoomRef);
                        }
                    }, 1000);

                    // update chat count for participating users

                    firebaseRef.child(`users/${recipient.ventureId}/chatCount`).once('value', snapshot => {
                        firebaseRef.child(`users/${recipient.ventureId}/chatCount`).set(snapshot.val() + 1);
                    });

                    firebaseRef.child(`users/${currentUserData.ventureId}/chatCount`).once('value', snapshot => {
                        firebaseRef.child(`users/${currentUserData.ventureId}/chatCount`).set(snapshot.val() + 1);
                    })

                } else {
                    chatRoomRef.child('timer/value').on('value', snapshot => {
                        this.setState({timerValInMs: snapshot.val() - 1});

                        if (this.state.timerValInMs < 1000) this._destroyChatroom(chatRoomRef);

                    })
                }
            });
        });

    },

    componentDidMount() {
        AppStateIOS.addEventListener('change', this._handleAppStateChange);
    },

    _destroyChatroom(chatRoomRef:string) {
        let currentChatroomRoute = _.last(this.props.navigator.getCurrentRoutes()),
            currentUserData = this.props.currentUserData,
            currentUserIDHashed = currentUserData.ventureId,
            firebaseRef = this.state.firebaseRef,
            currentUserMatchRequestsRef = firebaseRef.child('users/' + currentUserIDHashed + '/match_requests'),
            recipient = this.props.recipient,
            targetUserIDHashed = recipient.ventureId,
            targetUserMatchRequestsRef = firebaseRef.child('users/' + targetUserIDHashed + '/match_requests');

        // only navigate if still on chat page! :D

        if(currentChatroomRoute.title === 'Chat' && currentChatroomRoute.passProps._id === this.props._id) this.props.safelyNavigateToMainLayout();

        firebaseRef.child(`users/${targetUserIDHashed}/chatCount`).once('value', snapshot => {
            firebaseRef.child(`users/${targetUserIDHashed}/chatCount`).set(snapshot.val() - 1);
        });

        firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).once('value', snapshot => {
            firebaseRef.child(`users/${currentUserIDHashed}/chatCount`).set(snapshot.val() - 1);
        });

        chatRoomRef.child('timer/value').off();
        chatRoomRef.set({null});

        targetUserMatchRequestsRef.child(currentUserIDHashed).set(null);
        currentUserMatchRequestsRef.child(targetUserIDHashed).set(null);
    },

    _getTimerValue(numOfMilliseconds:number) {
        var date = new Date(numOfMilliseconds);
        return date.getMinutes() + 'm ' + date.getSeconds() + 's';
    },

    _handleAppStateChange(currentAppState) {
        let previousAppState = this.state.currentAppState;

        this.setState({currentAppState, previousAppState});

        // @hmm: Hack for maintaining timer when app goes in background
        // Background tasks are currently not supported in React Native

        if(currentAppState === 'background') this.setState({
            activeToBackgroundTimeRecordInMs: (new Date()).getTime()
        });

        if(previousAppState === 'background' && currentAppState === 'active') {
            let currentTimeInMs = (new Date()).getTime(),
                approxTimeSpentInBackgroundStateInMs = 1000 * Math.floor((currentTimeInMs-this.state.activeToBackgroundTimeRecordInMs) / 1000),
                updatedTimerValInMs = this.state.timerValInMs-approxTimeSpentInBackgroundStateInMs;

            if(updatedTimerValInMs < 1000) this._destroyChatroom(this.props.chatRoomRef);
            else this.setState({timerValInMs: updatedTimerValInMs });
        }
    },

    componentWillUnmount() {
        AppStateIOS.removeEventListener('change', this._handleAppStateChange);
    },

    render() {
        return (
            <View
                style={styles.timerBar}>
                <Text
                    style={styles.timer}>{this._getTimerValue(this.state.timerValInMs)}</Text>
            </View>
        )
    }
});

var styles = StyleSheet.create({
    activityPreferenceTitle: {
        color: '#fff',
        right: 10,
        fontSize: 22,
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        padding: 8,
        marginTop: 8
    },
    avatarActivityPreference: {
        fontSize: 12,
        color: 'black',
        fontFamily: 'AvenirNextCondensed-Regular',
        fontWeight: 'normal'
    },
    baseText: {
        fontFamily: 'AvenirNext-Regular'
    },
    container: {
        alignItems: 'center',
        flex: 1
    },
    messageList: {
        height: 1000,
        flex: 0.8,
        flexDirection: 'column',
        alignItems: 'center'
    },
    recipientActivity: {
        fontFamily: 'AvenirNextCondensed-Medium',
        fontSize: 24,
        marginRight: 40,
    },
    recipientBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        width: 375,
        height: 78,
    },
    recipientAvatar: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginHorizontal: 20
    },
    recipientDistance: {
        fontSize: 20,
        color: 'black',
        alignSelf: 'center',
        fontFamily: 'AvenirNext-UltraLight',
        fontWeight: '300'
    },
    rightContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    messageRow: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 10,
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 0.5,
        alignItems: 'center'
    },
    recipientAlign: {
        width: 40,
        height: 40,
        marginHorizontal: SCREEN_WIDTH / 40,
        borderRadius: 20
    },
    sentMessageRow: {
        flex: 1,
        flexDirection: 'column',
        padding: 10,
        marginLeft: 20
    },
    receivedMessageRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 10,
        marginRight: 20
    },
    sentMessageText: {
        color: 'white',
        fontSize: 16
    },
    tag: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        paddingHorizontal: SCREEN_WIDTH / 80,
        marginHorizontal: SCREEN_WIDTH / 70,
        paddingVertical: SCREEN_WIDTH / 170,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.4)'
    },
    tagBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10
    },
    tagsTitle: {
        color: '#222',
        fontSize: 16,
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    tagText: {
        color: 'rgba(255,255,255,0.95)',
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    textInput: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        width: SCREEN_WIDTH / 1.25,
        height: SCREEN_WIDTH / 12,
        bottom: 10,
        borderRadius: 10,
        paddingLeft: SCREEN_WIDTH / 25,
        alignSelf: 'center',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    receivedMessageText: {
        color: 'black',
        fontSize: 16
    },
    textBoxContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        width: SCREEN_WIDTH
    },
    timer: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    timerBar: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        width: SCREEN_WIDTH,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    userImage: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 1,
        margin: 6
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
        spring1: {
            duration: 250,
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
    animations.layout.easeInEaseOut,
    animations.layout.spring1
];


module.exports = Chat;