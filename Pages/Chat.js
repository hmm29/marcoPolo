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
    AsyncStorage,
    Image,
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
var { Icon, } = require('react-native-icons');
var LinearGradient = require('react-native-linear-gradient');
var ReactFireMixin = require('reactfire');
var TimerMixin = require('react-timer-mixin');

var CHAT_MATE_1_NAME = 'Ivonne Gonzalez';
var CHAT_MATE_2_NAME = 'Harrison Miller';
var ACTIVITY_PREFERENCE_1 = 'dinner';

var SCREEN_HEIGHT = Display.height;
var SCREEN_WIDTH = Display.width;

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

function compoundStyles() {
    var res = {};
    for (var i = 0; i < arguments.length; ++i) {
        if (arguments[i]) {
            Object.assign(res, arguments[i]);
        }
    }
    return res;
}

var Chat = React.createClass({

    mixins: [ReactFireMixin, TimerMixin],

    getInitialState() {
        return {
            chatRoomRefStr: null,
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

    componentWillMount() {
        var chatRoomRefStr = this.props.passProps.chatRoomRefStr.child('messages'), _this = this;

        this.bindAsObject(chatRoomRefStr, 'messageList');

        // @kp: first message in messageList is to initiate the room

        // @kp: first message in messageList is to initiate the room

        chatRoomRefStr.once('value', (snapshot) => {
            _this.setState({messageList: snapshot && _.cloneDeep(_.values(snapshot.val()))});
            _this.updateMessages(_.cloneDeep(_.values(snapshot.val())))
        });

        this.setState({chatRoomRefStr});
    },

    componentDidMount() {
        var _this = this,
            chatMate1IDHashed = this.props.passProps.recipient.ventureId,
            currentUserIDHashed = this.props.passProps.currentUserIDHashed;

        this.setTimeout(() => {
            _this._sendFakeMessage(chatMate1IDHashed, 'Hey yo');
        }, 2000);

        this.setTimeout(() => {
            _this._sendFakeMessage(currentUserIDHashed, 'Hey hey');
        }, 3500);

        this.setTimeout(() => {
            _this._sendFakeMessage(chatMate1IDHashed, 'I\'m so hungry. Missed the dhall.');
        }, 5000);

        this.setTimeout(() => {
            _this._sendFakeMessage(currentUserIDHashed, 'Me too. Wanna go to Mamoun\'s ?');
        }, 6500);

        this.setTimeout(() => {
            _this._sendFakeMessage(chatMate1IDHashed, 'YES! So down. We need to catch \nup.');
        }, 8000);

        this.setTimeout(() => {
            _this._sendFakeMessage(currentUserIDHashed, 'I KNOW. See you there in 10?');
        }, 9500);

        this.setTimeout(() => {
            _this._sendFakeMessage(chatMate1IDHashed, '😌✌🏾');
        }, 11000);

        this.state.chatRoomRefStr.once('value', (snapshot) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            _this.setState({
                contentOffsetYValue: 0,
                message: '',
                messageList: snapshot && _.cloneDeep(_.values(snapshot.val()))
            });
            _this.updateMessages(_.cloneDeep(_.values(snapshot.val())))
        });

    },

    componentWillUnmount() {
        var chatRoomRefStr = this.props.passProps.chatRoomRefStr.child('messages'), _this = this;

        this.state.chatRoomRefStr.set(null);

        chatRoomRefStr.once('value', (snapshot) => {
            _this.setState({messageList: ''});
            _this.updateMessages([])
        });
    },

    containerTouched(event) {
        this.refs.textInput.blur();
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

    render() {
        return (
            <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.96)'}}>
                <View>
                    {this._renderHeader()}
                </View>
                <View onStartShouldSetResponder={this.containerTouched} style={styles.container}>
                    <RecipientInfoBar navigator={this.props.navigator} recipientData={this.props.passProps}/>
                    <ListView
                        contentOffset={{x: 0, y: this.state.contentOffsetYValue}}
                        dataSource={this.state.dataSource}
                        renderRow={this._renderMessage}
                        initialListSize={15}
                        pageSize={15}
                        scrollsToTOp={false}
                        automaticallyAdjustContentInsets={false}
                        style={{backgroundColor: 'rgba(0,0,0,0.01)', width: SCREEN_WIDTH}}
                        >
                    </ListView>
                    <View>
                        <View
                            style={[styles.textBoxContainer, {marginBottom: this.state.hasKeyboardSpace ? SCREEN_HEIGHT/3.1 : 0}]}>
                            <TextInput
                                ref='textInput'
                                onBlur={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({hasKeyboardSpace: false})
                    }}
                                onFocus={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({hasKeyboardSpace: true})
                    }}
                                multiline={true}
                                style={{width: SCREEN_WIDTH/1.2, backgroundColor: 'rgba(255,255,255,0.75)', height: 30, paddingLeft: 10, borderColor: 'gray', borderRadius: 10, fontFamily: 'AvenirNext-Regular', color: '#111', borderWidth: 1, margin: SCREEN_WIDTH/35}}
                                onChangeText={(text) => this.setState({message: text})}
                                value={this.state.message}
                                returnKeyType='send'
                                keyboardType='default'
                                />
                            <Text onPress={() => {
                        if(this.state.message.length) this._sendMessage()
                    }}
                                  style={{color: 'white', fontFamily: 'AvenirNextCondensed-Regular', marginHorizontal: 20}}>Send</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    },

    _renderHeader() {
        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={() => this.props.navigator.pop()} style={{right: 30}}>
                    <Icon
                        color="#fff"
                        name="ion|ios-arrow-thin-left"
                        size={32}
                        style={{width: 32, height: 32}}
                        />
                </TouchableOpacity>
                <Text
                    style={{color: '#fff', right: 10, fontSize: 22, fontFamily: 'AvenirNextCondensed-Medium'}}>
                    {ACTIVITY_PREFERENCE_1 && ACTIVITY_PREFERENCE_1.toUpperCase() + '?'} </Text>
                <Text />
            </View>
        );
    },

    _renderMessage(message:Object) {
        var recipient = this.props.passProps.recipient,
            currentUserIDHashed = this.props.passProps.currentUserIDHashed,
            messageRowStyle = styles.receivedMessageRow,
            messageTextStyle = styles.receivedMessageText,
            sent = (currentUserIDHashed === message.senderIDHashed);

        if (!sent) {
            messageRowStyle = styles.sentMessageRow;
            messageTextStyle = styles.sentMessageText;
        }

        var avatarImage = (!sent) ? `https://res.cloudinary.com/dwnyawluh/image/upload/v1442206129/${CHAT_MATE_1_NAME.split(' ')[0]}%20${CHAT_MATE_1_NAME.split(' ')[1]}.png` : `https://res.cloudinary.com/dwnyawluh/image/upload/v1442206129/${CHAT_MATE_2_NAME.split(' ')[0]}%20${CHAT_MATE_2_NAME.split(' ')[1]}.png`;

        var space = (
            <Image
                source={{uri: avatarImage}}
                style={styles.recipientAlign}/>
        );
        return (
            <LinearGradient
                colors={(!sent) ? ['#124B8F', '#2C90C8', '#fff'] : ['#fff', '#fff']}
                start={[0,1]}
                end={[1,0.9]}
                locations={[0,1.0,0.9]}
                style={styles.messageRow}>
                { (!sent) ? space : null }
                <View style={messageRowStyle}>
                    <Text style={styles.baseText}>
                        <Text style={messageTextStyle}>
                            {message.body}
                        </Text>
                    </Text>
                </View>
                { (sent) ? space : null }
            </LinearGradient>
        );
    },

    _sendMessage() {
        var _this = this;

        var messageObj = {
            senderIDHashed: this.props.passProps.currentUserIDHashed,
            body: this.state.message
        };
        this.state.chatRoomRefStr.push(messageObj);
        this.state.chatRoomRefStr.once('value', (snapshot) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            _this.setState({
                contentOffsetYValue: 0,
                message: '',
                messageList: snapshot && _.cloneDeep(_.values(snapshot.val()))
            });
            _this.updateMessages(_.cloneDeep(_.values(snapshot.val())))
        });
    },
    _sendFakeMessage(IDHashed, message) {
        var _this = this;

        var messageObj = {
            senderIDHashed: IDHashed,
            body: message
        };
        this.state.chatRoomRefStr.push(messageObj);
        this.state.chatRoomRefStr.once('value', (snapshot) => {
            var config = layoutAnimationConfigs[2];
            LayoutAnimation.configureNext(config);

            _this.setState({
                contentOffsetYValue: 0,
                message: '',
                messageList: snapshot && _.cloneDeep(_.values(snapshot.val()))
            });
            _this.updateMessages(_.cloneDeep(_.values(snapshot.val())))
        });
    }
});

var RecipientInfoBar = React.createClass({
    propTypes: {
        recipientData: React.PropTypes.object.isRequired,
    },

    getInitialState() {
        return {
            activity: this.props.recipientData.currentUser.activityPreference,
            age: _.random(19, 23),
            dir: 'row',
            infoContent: 'recipient',
            time: '2'
        }
    },

    componentDidMount() {
        console.log('Mounted Chat Info Bar');
    },

    getUserAge(firstName:string) {
        if(firstName === 'Sophie') return 20;
        else if(firstName === 'Clint') return 19;
        else if(firstName === 'Jessica') return 19;
        else if(firstName === 'Viviana') return 19;
        else if(firstName === 'Alex') return 21;
        else if(firstName === 'Titania') return 19;
        else if(firstName === 'Becky') return 21;
        else return this.state.age;
    },

    render(){
        var recipient = this.props.recipientData.recipient;
        var currentUser = this.props.recipientData.currentUser;

        var user = (this.state.infoContent === 'recipient' ? recipient : currentUser);

        var secondTag;

        if (user.activityPreference === 'insomnia' || user.activityPreference === 'wenzel' || user.activityPreference === 'dinner' || user.activityPreference === 'pizza' || user.activityPreference === 'froyo' || user.activityPreference === 'sushi') {
            secondTag = 'food';
        } else {
            secondTag = 'yaliezz';
        }

        var infoContent = (
            <View
                style={{paddingVertical: (user === recipient ? SCREEN_HEIGHT/40 : SCREEN_HEIGHT/97), backgroundColor: '#eee', flexDirection: 'column', justifyContent: 'center'}}>
                <Image source={{uri: user.picture}}
                       style={{width: SCREEN_WIDTH/1.8, height: SCREEN_WIDTH/1.8, borderRadius: SCREEN_WIDTH/3.6, alignSelf: 'center', marginVertical: SCREEN_WIDTH/18}}/>
                <Text
                    style={{color: '#222', fontSize: 20, fontFamily: 'AvenirNextCondensed-Medium', textAlign: 'center'}}>
                    {user.firstName || 'Harrison'}, {this.getUserAge(user.firstName)} {'\t'} |{'\t'}
                    <Text style={{fontFamily: 'AvenirNextCondensed-Medium'}}>
                        <Text
                            style={{fontSize: 20}}>{user === currentUser ? this.state.activity && this.state.activity.toUpperCase() : user.activityPreference && user.activityPreference.capitalize()}</Text>: {this.state.time}
                        PM {'\n'}
                    </Text>
                </Text>
                {user === currentUser ? <TextInput
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
                    <Text style={{color: '#222', fontSize: 16, fontFamily: 'AvenirNextCondensed-Regular'}}>TAGS: </Text>
                    {[user.activityPreference && user.activityPreference.toLowerCase(), secondTag].map((tag) => (
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
                    this.setState({infoContent: 'recipient', dir: (this.state.dir === 'row' ? 'column' : 'row')})
                }} navigator={this.props.navigator} recipient={recipient}/>
                    <View style={styles.rightContainer}>
                        <Text style={styles.recipientDistance}> {this.props.recipientData.distance} </Text>
                    </View>
                    <RecipientAvatar onPress={() => {
                    var config = layoutAnimationConfigs[0];
                    LayoutAnimation.configureNext(config);
                   this.setState({infoContent: 'currentUser', dir: (this.state.dir === 'row' ? 'column' : 'row')})
                }} navigator={this.props.navigator} currentUserActivityPreference={this.state.activity}
                                     currentUser={currentUser} style={{marginRight: 20}}/>
                </View>
                <TimerBar/>
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
        currentUser: React.PropTypes.object,
        currentUserActivityPreference: React.PropTypes.string,
        recipient: React.PropTypes.object
    },

    render() {
        var user;

        if(this.props.recipient) user = {firstName: CHAT_MATE_1_NAME.split(' ')[0], picture: `https://res.cloudinary.com/dwnyawluh/image/upload/v1442206129/${CHAT_MATE_1_NAME.split(' ')[0]}%20${CHAT_MATE_1_NAME.split(' ')[1]}.png`}
        else user = {firstName: CHAT_MATE_2_NAME.split(' ')[0], picture: `https://res.cloudinary.com/dwnyawluh/image/upload/v1442206129/${CHAT_MATE_2_NAME.split(' ')[0]}%20${CHAT_MATE_2_NAME.split(' ')[1]}.png`}

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
    getInitialState() {
        return {
            timerValueInMilliseconds: 300000
        }
    },

    mixins: [TimerMixin],

    _handle: null,

    componentDidMount() {
        var _this = this;

        this._handle = this.setInterval(() => {
            _this.setState({
                timerValueInMilliseconds: _this.state.timerValueInMilliseconds - 1000
            })
        }, 1000);

    },

    componentWillUnmount() {
        this.clearInterval(this._handle);
    },

    _getTimerValue(numOfMilliseconds:number) {
        var date = new Date(numOfMilliseconds);
        return date.getMinutes() + 'm ' + date.getSeconds() + 's';
    },

    render() {
        return (
            <View
                style={{backgroundColor: 'rgba(0,0,0,0.2)', width: SCREEN_WIDTH, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                <Text
                    style={{color: '#fff', fontFamily: 'AvenirNextCondensed-Medium'}}>{this._getTimerValue(this.state.timerValueInMilliseconds)}</Text>
            </View>
        )
    }
});


var styles = StyleSheet.create({
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
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        paddingTop: 30,
        paddingBottom: 15
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
        marginVertical: 10,
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
    userImage: {
        height: 20,
        width: 20,
        borderRadius: 10,
        borderWidth: 1,
        margin: 6
    }
});

module.exports = Chat;