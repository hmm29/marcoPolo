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
    SwitchIOS,
    View
    } = React;

var _ = require('lodash');
var CheckboxIcon = require('../Partials/Icons/CheckboxIcon');
var ChevronIcon = require('../Partials/Icons/ChevronIcon');
var ClockIcon = require('../Partials/Icons/ClockIcon');
var Display = require('react-native-device-display');
var DDPClient = require('ddp-client');
var { Icon, } = require('react-native-icons');
var Logo = require('../Partials/Logo');
var MainLayout = require('../Layouts/MainLayout');

var ADD_INFO_BUTTON_SIZE = 24;
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var NEXT_BUTTON_SIZE = 28;
var SCREEN_HEIGHT = Display.height;
var SCREEN_WIDTH = Display.width;

var Home = React.createClass({
    statics: {
        title: '<Home>',
        description: 'Venture Home Page - activity selection.'
    },

    getDefaultProps() {
        return {
            ddpClient: new DDPClient({
                port: 443,
                ssl: true,
                url: 'wss://lb1.ventureappofficial.me/websocket'
            })
        }
    },

    getInitialState() {
        return {
            ddpClient: this.props.ddpClient,
            showAddInfoBox: false,
            showNextButton: false,
            showTrendingItems: true,
            hasKeyboardSpace: false,
            viewStyle: {
                marginHorizontal: null
            }
        }
    },

    componentWillMount() {
        this.state.ddpClient.connect((err, wasReconnect) => {

            if (err) {
                console.log('DDP connection error!');
                return;
            }

            if (wasReconnect) console.log('Reestablishment of a connection.');
        });
    },

    onSubmitActivity() {
        this.props.navigator.push({
            title: 'Users',
            component: MainLayout,
            passProps: {selected: 'users'}
        });
    },

    render() {
        return (
            <Image
                source={{uri: `https://res.cloudinary.com/dwnyawluh/image/upload/w_${PixelRatio.getPixelSizeForLayoutSize(SCREEN_WIDTH)},h_${PixelRatio.getPixelSizeForLayoutSize(SCREEN_HEIGHT)}/v1442117785/Venture_-_Vandy_-_Homepage_rqwyuy.png`}}
                style={styles.container}>
                <Logo
                    logoContainerStyle={{position: 'absolute', top: SCREEN_HEIGHT/8, width: LOGO_WIDTH, height: LOGO_HEIGHT, marginHorizontal: (SCREEN_WIDTH - LOGO_WIDTH) / 2}}
                    logoStyle={{width: LOGO_WIDTH, height: LOGO_HEIGHT}}/>
                <ActivityTextInput onSubmit={this.onSubmitActivity}/>
                <AddInfoButton onPress={() => {
                    this.setState({showAddInfoBox: !this.state.showAddInfoBox})
                }} showAddInfoBox={this.state.showAddInfoBox}/>
                {this.state.showAddInfoBox ? <AddInfoBox /> : <View/>}
                {this.state.showTrendingItems && !this.state.showAddInfoBox ? <TrendingItemsCarousel /> : <View/>}
            </Image>
        );
    }
});

var ActivityTextInput = React.createClass({
    propTypes: {
        onSubmit: React.PropTypes.func.isRequired
    },

    getInitialState() {
        return {
            input: '',
            showNextButton: false
        }
    },

    render() {
        return (
            <View style={styles.activitySelection}>
                <TextInput
                    autoCapitalize='none'
                    autoCorrect={false}
                    maxLength={15}
                    onChangeText={(text) => {
                        this.setState({input: text.toUpperCase(), showNextButton: !!text.length});
                    }}
                    placeholder={'What do you want to do?'}
                    placeholderTextColor={'rgba(255,255,255,1.0)'}
                    returnKeyType='done'
                    style={styles.activityTextInput}
                    value={this.state.input}/>
                {this.state.showNextButton ? <NextButton onPress={this.props.onSubmit}/> : <View />}
            </View>
        );
    }
});

var AddInfoBox = React.createClass({
    getInitialState() {
        return {
            activeTimeOption: 'now',
            contentOffsetXVal: 0,
            date: new Date(),
            hasIshSelected: false,
            hasSpecifiedTime: false,
            showTimeSpecificationOptions: false,
            timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60
        };
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

    onDateChange(date):void {
        this.setState({date: date});
    },

    render() {
        var content;

        if (this.state.showTimeSpecificationOptions) {
            content = (
                <View style={styles.timeSpecificationOptions}>
                    <DatePickerIOS
                        date={this.state.date}
                        mode="time"
                        timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
                        onDateChange={this.onDateChange}
                        minuteInterval={10}
                        style={styles.datePicker}/>
                    <View style={styles.timeSpecificationButtons}>
                        <ClockIcon
                            active={false}
                            caption='Done'
                            captionStyle={{color: '#fff'}}
                            onPress={() => this.setState({showTimeSpecificationOptions: false})}/>
                        <CheckboxIcon
                            active={this.state.hasIshSelected}
                            caption='-ish'
                            captionStyle={{color: '#fff'}}
                            onPress={() => this.setState({hasIshSelected: !this.state.hasIshSelected})}/>
                    </View>

                </View>
            );
        } else {
            let isAtScrollViewStart = this.state.contentOffsetXVal === 0;

            content = (
                <View style={styles.addTimeInfoContainer}>
                    <ScrollView
                        automaticallyAdjustContentInsets={false}
                        canCancelContentTouches={false}
                        centerContent={true}
                        contentContainerStyle={{flex: 1, flexDirection: 'row', width: SCREEN_WIDTH * 1.18}}
                        contentOffset={{x: this.state.contentOffsetXVal, y: 0}}
                        horizontal={true}
                        directionalLockEnabled={true}
                        style={[styles.scrollView, styles.horizontalScrollView, {paddingTop: 10}]}>
                        <CheckboxIcon
                            active={this.state.activeTimeOption === 'now'}
                            caption='now'
                            captionStyle={styles.captionStyle}
                            color='#7cff9d'
                            onPress={() => this.setState({activeTimeOption: 'now', hasSpecifiedTime: false})}/>
                        <CheckboxIcon
                            active={this.state.activeTimeOption === 'later'}
                            caption='later'
                            captionStyle={styles.captionStyle}
                            color='#ffd65c'
                            onPress={() => this.setState({activeTimeOption: 'later', hasSpecifiedTime: false})}/>
                        <ClockIcon
                            active={this.state.activeTimeOption === 'specify'}
                            caption={this.state.hasSpecifiedTime ? this._getTimeString(this.state.date) : 'specify'}
                            captionStyle={styles.captionStyle}
                            onPress={() => {
                            if(this.state.activeTimeOption === 'specify') this.setState({hasSpecifiedTime: true, showTimeSpecificationOptions: true});
                            else this.setState({activeTimeOption: 'specify'})
                        }}/>
                    </ScrollView>
                    <View style={[styles.scrollbarArrow, (isAtScrollViewStart ? {right: 10} : {left: 10})]}>
                        <ChevronIcon
                            direction={isAtScrollViewStart ? 'right' : 'left'}
                            onPress={() => this.setState({contentOffsetXVal: (isAtScrollViewStart ? SCREEN_WIDTH/2.5 : 0)})}/>
                    </View>
                </View>
            )
        }

        return (
            <View style={styles.addInfoBox}>
                <Title>WHEN?</Title>
                {content}
                <TagSelection />
            </View>
        );
    }
});

var AddInfoButton = React.createClass({
    propTypes: {
        onPress: React.PropTypes.func.isRequired,
        showAddInfoBox: React.PropTypes.bool.isRequired
    },
    render() {
        return (
            <View style={styles.addInfoButtonContainer}>
                <TouchableOpacity
                    activeOpacity={0.4}
                    onPress={this.props.onPress}>
                    <Icon
                        name={this.props.showAddInfoBox ? 'ion|chevron-up' : 'ion|ios-plus'}
                        size={ADD_INFO_BUTTON_SIZE}
                        color='#fff'
                        style={{width: ADD_INFO_BUTTON_SIZE, height: ADD_INFO_BUTTON_SIZE}}
                        />
                </TouchableOpacity>
            </View>
        );
    }
});

class NextButton extends React.Component {
    render() {
        return (
            <View style={styles.nextButtonContainer}>
                <TouchableOpacity
                    activeOpacity={0.4}
                    onPress={this.props.onPress}>
                    <Icon
                        name='ion|arrow-right-b'
                        size={NEXT_BUTTON_SIZE}
                        color='#fff'
                        style={{width: NEXT_BUTTON_SIZE, height: NEXT_BUTTON_SIZE}}
                        />
                </TouchableOpacity>
            </View>
        );
    }
}

var TagSelection = React.createClass({
    getInitialState() {
        return {
            input: '',
            tags: []
        }
    },

    _createTag(tagVal:string, i) {
        return <Tag key={i} value={tagVal}/>;
    },

    render() {
        return (
            <View style={styles.tagSelection}>
                <Title fontSize={16}>TAGS</Title>
                <TextInput
                    autoCapitalize='none'
                    autoCorrect={false}
                    maxLength={15}
                    onChangeText={(text) => {
                        this.setState({input: text});
                    }}
                    placeholder={'Add tags here'}
                    placeholderTextColor={'rgba(255,255,255,0.9)'}
                    returnKeyType='done'
                    style={styles.tagsInputText}
                    value={this.state.input}/>
                <ScrollView
                    automaticallyAdjustContentInsets={false}
                    centerContent={true}
                    horizontal={true}
                    directionalLockEnabled={true}
                    showsHorizontalScrollIndicator={true}
                    style={[styles.scrollView, {height: 20}]}>
                    {this.state.tags.map(this._createTag)}
                </ScrollView>
            </View>
        );
    }
});

var Tag = React.createClass({
    render() {

    }
});


var YALIES = ['http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_56,w_64/v1442206258/Harrison%20Miller.png', 'https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_52,w_64/v1442206076/Noah%20Cho.png', 'https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_64/v1442205943/Sophie%20Dillon.png'];
var EVENTS = ['http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_64,q_78,w_200/v1442898929/Event%20-%20Frozen%20Four%20(Center%20-%20Big%20Text).png', 'https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_64,q_48,w_200/v1442894669/Event%20-%20Freshman%20Screw%20(Center%20-%20Big%20Text).png'];

var createTrendingUser = (uri, i) => <TrendingItem type='user' key={i} uri={uri}/>;
var createTrendingEvent = (uri, i) => <TrendingItem type='event' key={i} uri={uri}/>;

var TrendingItemsCarousel = React.createClass({
    getInitialState() {
        return {
            trendingContent: 'YALIES'
        }
    },

    render():ReactElement {
        return (
            <View style={styles.trendingItemsCarousel}>
                <Title>TRENDING <Text style={{color: '#ee964b'}}>{this.state.trendingContent}</Text></Title>
                <ScrollView
                    horizontal={true}
                    centerContent={true}
                    directionalLockEnabled={true}
                    pagingEnabled={true}
                    snapToAlignment='center'
                    snapToInterval={64}
                    style={[styles.scrollView, styles.horizontalScrollView]}>
                    {YALIES.map(createTrendingUser)}
                    {EVENTS.map(createTrendingEvent)}
                </ScrollView>
            </View>
        );
    }
});

class TrendingItem extends React.Component {
    render():ReactElement {
        if (this.props.type === 'user') {
            return (
                <View style={styles.trendingItem}>
                    <Image style={styles.trendingUserImg} source={{uri:this.props.uri}}/>
                </View>
            );
        } else {
            return (
                <View style={styles.trendingItem}>
                    <Image style={styles.trendingEventImg} source={{uri:this.props.uri}}/>
                </View>
            );
        }
    }
}

var Title = React.createClass({
    render() {
        return (
            <Text
                style={[styles.title, {fontSize: this.props.fontSize}, this.props.titleStyle]}>{this.props.children}</Text>
        );
    }
});

var ACTIVITY_TEXT_INPUT_PADDING = 5;

var styles = StyleSheet.create({
    activitySelection: {
        height: SCREEN_HEIGHT / 15
    },
    activityTextInput: {
        width: SCREEN_WIDTH,
        borderWidth: 0.5,
        borderColor: '#0f0f0f',
        backgroundColor: 'rgba(0,0,0,0.8)',
        flex: 1,
        fontSize: SCREEN_HEIGHT / 30,
        padding: ACTIVITY_TEXT_INPUT_PADDING,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    addInfoBox: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT / 18,
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        padding: 8
    },
    addInfoButton: {},
    addInfoButtonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        width: SCREEN_WIDTH,
        position: 'absolute',
        marginTop: SCREEN_HEIGHT / 40
    },
    addTimeInfoContainer: {},
    captionStyle: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    nextButtonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: SCREEN_WIDTH,
        position: 'absolute',
        bottom: ACTIVITY_TEXT_INPUT_PADDING * 2
    },
    scrollView: {
        backgroundColor: 'rgba(0,0,0,0.08)'
    },
    horizontalScrollView: {
        height: 80,
    },
    timeSpecificationOptions: {
        flex: 1,
        flexDirection: 'column'
    },
    timeSpecificationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    title: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular',
        fontSize: 20,
        textAlign: 'center',
        paddingVertical: 5
    },
    tagsInputText: {
        borderWidth: 0.5,
        borderColor: '#0f0f0f',
        backgroundColor: 'rgba(0,0,0,0.8)',
        flex: 1,
        padding: ACTIVITY_TEXT_INPUT_PADDING,
        height: SCREEN_HEIGHT / 20,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    tagSelection: {
        marginVertical: 10
    },
    datePicker: {
        width: SCREEN_WIDTH / 1.2,
        height: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        margin: 10,
        paddingLeft: 18
    },
    scrollbarArrow: {
        position: 'absolute',
        bottom: 15
    },
    trendingItems: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    trendingItem: {
        borderRadius: 3,
        marginHorizontal: SCREEN_WIDTH / 30
    },
    trendingItemsCarousel: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT / 35,
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10
    },
    trendingUserImg: {
        width: SCREEN_WIDTH / 5,
        height: 64,
        resizeMode: 'contain'
    },
    trendingEventImg: {
        width: SCREEN_WIDTH / 1.4,
        height: 64,
        resizeMode: 'contain'
    }

});


module.exports = Home;