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
var ChatsListPageIcon = require('../Partials/Icons/ChatsListPageIcon');
var CheckboxIcon = require('../Partials/Icons/CheckboxIcon');
var ChevronIcon = require('../Partials/Icons/ChevronIcon');
var ClockIcon = require('../Partials/Icons/ClockIcon');
var Display = require('react-native-device-display');
var DDPClient = require('ddp-client');
var Header = require('../Partials/Header');
var { Icon, } = require('react-native-icons');
var Logo = require('../Partials/Logo');
var MainLayout = require('../Layouts/MainLayout');
var ProfilePageIcon = require('../Partials/Icons/ProfilePageIcon');

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

    getInitialState() {
        return {
            ddpClient: new DDPClient({
                port: 443,
                ssl: true,
                url: 'wss://lb1.ventureappofficial.me/websocket'
                }),
            hasKeyboardSpace: false,
            input: '',
            showAddInfoBox: false,
            showNextButton: false,
            showTrendingItems: true,
            tagsArr: [],
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

    _handleTagChange(tagsArr:Array) {
        this.setState({tagsArr});
    },

    onSubmitActivity() {
        var activityInput = (this.state.input).replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' '),
            activityPreferenceChange = {
                title: activityInput,
                tags: this.state.tagsArr
            }, _this = this;

        //AsyncStorage.getItem('@AsyncStorage:Venture:account')
        //    .then((account:string) => {
        //        account = JSON.parse(account);
        //
        //        this.state.ddpClient.call('Accounts.updateUser', [{ventureId: account.ventureId}, activityPreferenceChange, account.ventureId, account.name, account.email],
        //            function (err, resp) {
        //                if (resp) {
        //                    AsyncStorage.setItem('@AsyncStorage:Venture:account', JSON.stringify(_.assign(account, activityPreferenceChange)))
        //                        .catch((error) => console.log(error.message))
        //                        .done();
        //                }
        //                if (err) {
        //                    alert(err.message);
        //                }
        //
        //            });
        //    })
        //    .catch((error) => console.log(error.message))
        //    .done();


        this.props.navigator.push({
            title: 'Users',
            component: MainLayout,
            passProps: {selected: 'users'}
        });

    },

    render() {
        let activityTextInput = (
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
                {this.state.showNextButton ? <NextButton onPress={this.onSubmitActivity}/> : <View />}
            </View>
        );


        return (
            <Image
                source={require('image!HomeBackground')}
                style={styles.container}>
                <Header>
                    <ProfilePageIcon onPress={() =>  this.props.navigator.push({
                        title: 'Users',
                        component: MainLayout,
                        passProps: {selected: 'profile'}
                    })} />
                    <ChatsListPageIcon onPress={() =>  this.props.navigator.push({
                    title: 'Users',
                    component: MainLayout,
                    passProps: {selected: 'chats'}
                })} />
                </Header>
                <Logo
                    logoContainerStyle={styles.logoContainerStyle}
                    logoStyle={styles.logoStyle}/>
                {activityTextInput}
                <AddInfoButton onPress={() => {
                    this.setState({showAddInfoBox: !this.state.showAddInfoBox})
                }} showAddInfoBox={this.state.showAddInfoBox}/>
                {this.state.showAddInfoBox ? <AddInfoBox handleTagChange={this._handleTagChange} /> : <View/>}
                {this.state.showTrendingItems && !this.state.showAddInfoBox ? <TrendingItemsCarousel /> : <View/>}
            </Image>
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
                        style={styles.timeSpecificationDatePicker}/>
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
                <TagSelection handleTagChange={this.props.handleTagChange} />
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
                    onPress={() =>  InteractionManager.runAfterInteractions(() => {
                        this.props.onPress();
                    })}>
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
                        if(text[text.length-1] === ',') {
                        var tagsArr = this.state.tags;

                        tagsArr.push(text.substr(0, text.length-1));

                        this.setState({tagsArr, input: ''});
                        this.props.handleTagChange(tagsArr);
                    }
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
                    {this.state.tags.map((tag) => {
                        return (
                            <TouchableOpacity onPress={() => {
                            this.setState({tags: _.remove(this.state.tags,
                                (tagVal) => {
                                return tagVal !== tag;
                                }
                            )});
                        }} style={styles.tag}><Text
                                style={styles.tagText}>{tag}</Text></TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        );
    }
});

var YALIES = [`http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_56,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442206258/Harrison%20Miller.png`, `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_52,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442206076/Noah%20Cho.png`, `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Sophie%20Dillon.png`];
var EVENTS = [`http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20Frozen%20Four%20(Center%20-%20Big%20Text).png`, `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_48,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442894669/Event%20-%20Freshman%20Screw%20(Center%20-%20Big%20Text).png`];

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
                    pagingEnabled={true}
                    directionalLockEnabled={true}
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
    render() {
        if (this.props.type === 'user') {
            return (
                <TouchableOpacity style={styles.trendingItem}>
                    <Image style={styles.trendingUserImg} source={{uri:this.props.uri}}/>
                </TouchableOpacity>
            );
        } else {
            return (
                <TouchableOpacity style={styles.trendingItem}>
                    <Image style={styles.trendingEventImg} source={{uri:this.props.uri}}/>
                </TouchableOpacity>
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
        fontSize: SCREEN_HEIGHT / 25,
        padding: ACTIVITY_TEXT_INPUT_PADDING,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'AvenirNextCondensed-UltraLight'
    },
    addInfoBox: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT / 30,
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        paddingTop: 8
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
    logoContainerStyle: {
        position: 'absolute',
        top: SCREEN_HEIGHT/6,
        marginHorizontal: (SCREEN_WIDTH - LOGO_WIDTH) / 2
    },
    logoStyle: {
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT
    },
    nextButtonContainer: {
        flex: 1,
        flexDirection: 'row',
        position: 'absolute',
        right: 10,
        bottom: ACTIVITY_TEXT_INPUT_PADDING * 2
    },
    scrollView: {
        backgroundColor: 'rgba(0,0,0,0.008)'
    },
    horizontalScrollView: {
        height: 85
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
        marginTop: 10,
        bottom: 20,
        height: SCREEN_HEIGHT / 6.5

},
    timeSpecificationDatePicker: {
        top: 10,
        height: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    scrollbarArrow: {
        position: 'absolute',
        bottom: 15
    },
    tag: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        paddingHorizontal: SCREEN_WIDTH / 80,
        marginHorizontal: SCREEN_WIDTH / 70,
        paddingVertical: SCREEN_WIDTH / 170,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.4)',
        top: 4
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
        marginHorizontal: SCREEN_WIDTH / 30
    },
    trendingItemsCarousel: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT / 35,
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        justifyContent: 'center',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10
    },
    trendingUserImg: {
        width: SCREEN_WIDTH / 5.2,
        height: 64,
        resizeMode: 'contain'
    },
    trendingEventImg: {
        width: SCREEN_WIDTH / 1.39,
        height: 64,
        resizeMode: 'contain'
    }
});


module.exports = Home;