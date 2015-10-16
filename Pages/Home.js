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
    View
    } = React;

var _ = require('lodash');
var ChatsListPageIcon = require('../Partials/Icons/ChatsListPageIcon');
var CheckboxIcon = require('../Partials/Icons/CheckboxIcon');
var ChevronIcon = require('../Partials/Icons/ChevronIcon');
var ClockIcon = require('../Partials/Icons/ClockIcon');
var Display = require('react-native-device-display');
var Header = require('../Partials/Header');
var { Icon, } = require('react-native-icons');
var Logo = require('../Partials/Logo');
var MainLayout = require('../Layouts/MainLayout');
var ProfilePageIcon = require('../Partials/Icons/ProfilePageIcon');

var ADD_INFO_BUTTON_SIZE = 32;
var ACTIVITY_TEXT_INPUT_PADDING = 5;
var ACTIVITY_TITLE_INPUT_REF = 'activityTitleInput'
var LOGO_WIDTH = 200;
var LOGO_HEIGHT = 120;
var NEXT_BUTTON_SIZE = 28;
var SCREEN_HEIGHT = Display.height;
var SCREEN_WIDTH = Display.width;
var TAG_TEXT_INPUT_PADDING = 3;

var YALIES = [`http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_56,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442206258/Harrison%20Miller.png`, `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_52,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442206076/Noah%20Cho.png`, `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Sophie%20Dillon.png`];
var EVENTS = [`http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20Frozen%20Four%20(Center%20-%20Big%20Text).png`, `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_48,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442894669/Event%20-%20Freshman%20Screw%20(Center%20-%20Big%20Text).png`,`http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20Frozen%20Four%20(Center%20-%20Big%20Text).png`];

var Home = React.createClass({
    statics: {
        title: '<Home>',
        description: 'Main screen - activity selection.'
    },

    getInitialState() {
        return {
            activityTitleInput: '',
            hasKeyboardSpace: false,
            showAddInfoBox: false,
            showAddInfoButton: true,
            showNextButton: false,
            showTextInput: true,
            showTrendingItems: true,
            tagsArr: [],
            trendingContent: 'YALIES',
            viewStyle: {
                marginHorizontal: 0,
                borderRadius: 0
            },
            activeTimeOption: 'now',
            contentOffsetXVal: 0,
            date: new Date(),
            hasIshSelected: false,
            hasSpecifiedTime: false,
            showTimeSpecificationOptions: false,
            tagInput: '',
            timeZoneOffsetInHours: (-1) * (new Date()).getTimezoneOffset() / 60
        }
    },

    componentDidMount() {
        AsyncStorage.getItem('@AsyncStorage:Venture:account')
            .then((account: string) => {
                account = JSON.parse(account);
                this.setState({ventureId: account.ventureId});
            })
            .catch((error) => console.log(error.message))
            .done();
    },

    animateViewLayout(text:string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({
            viewStyle: {
                marginHorizontal: text.length ? SCREEN_WIDTH / 12 : null,
                borderRadius: text.length ? 10 : 0
            }
        });
    },

    _createTrendingItem(type, uri,i) {
        return (
            <TrendingItem type={type} key={i} uri={uri}/>
        )

    },

    onSubmitActivity() {
        let activityTitleInputWithoutPunctuation = (this.state.activityTitleInput).replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' '),
            activityPreferenceChange = {
                title: activityTitleInputWithoutPunctuation + '?',
                tags: this.state.tagsArr,
                status: this.state.activeTimeOption.toUpperCase(),
                start: {
                    time: (this.state.activeTimeOption === 'specify' ? this._getTimeString(this.state.date) : ''),
                    dateTime: this.state.date,
                    timeZoneOffsetInHours: this.state.timeZoneOffsetInHours
                },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            firebaseRef = new Firebase('https://ventureappinitial.firebaseio.com/');

        // @hmm: have to manually blur the text input,
        // since were not using navigator.push()

        this.refs[ACTIVITY_TITLE_INPUT_REF].blur();

        AsyncStorage.getItem('@AsyncStorage:Venture:account')
            .then((account: string) => {
                account = JSON.parse(account);
                firebaseRef.child(`users/${account.ventureId}/activityPreference`).set(activityPreferenceChange)

                this._safelyNavigateForward({title: 'Users', component: MainLayout, passProps: {selected: 'users', ventureId: account.ventureId}})
            })
            .catch((error) => console.log(error.message))
            .done();

    },

    _createTag(tag:string) {
        return (
            <TouchableOpacity onPress={() => {
                            this.setState({tagsArr: _.remove(this.state.tagsArr,
                                (tagVal) => {
                                return tagVal !== tag;
                                }
                            )});
                        }} style={styles.tag}><Text
                style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
        )
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

    handleScroll: function(event: Object) {
        if(event.nativeEvent.contentOffset.x < 0) {}
        else if(event.nativeEvent.contentOffset.x > 200 && event.nativeEvent.contentOffset.x < 300) this.setState({trendingContent: 'YALIES'})
        else this.setState({trendingContent: 'EVENTS'});
    },

    _safelyNavigateForward(route:{title:string, component:ReactClass<any,any,any>, passProps?:Object}) {
        let abbrevRoute = _.omit(route, 'component'),
            currentRouteStack = this.props.navigator.getCurrentRoutes();

        if(currentRouteStack.indexOf(abbrevRoute) > -1) {
            this.props.navigator.jumpTo(abbrevRoute);
        }

        else {
            currentRouteStack.push(route);
            this.props.navigator.immediatelyResetRouteStack(currentRouteStack)
        }
    },

    _onBlur() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({hasKeyboardSpace: false, showAddInfoButton: true, showNextButton: !!this.state.activityTitleInput, showTextInput: true});
    },

    onDateChange(date): void {
        this.setState({date: date});
    },

    _onFocus() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
        this.setState({hasKeyboardSpace: true, showAddInfoButton: false, showNextButton: false, showTextInput: false});
    },

    render() {
        let content,
            isAtScrollViewStart = this.state.contentOffsetXVal === 0,
            tagSelection;

        let activityTitleInput = (
            <TextInput
                ref={ACTIVITY_TITLE_INPUT_REF}
                autoCapitalize='none'
                autoCorrect={false}
                maxLength={15}
                onChangeText={(text) => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                        this.setState({activityTitleInput: text.toUpperCase(), showNextButton: !!text});
                        this.animateViewLayout(text);
                    }}
                placeholder={'What do you want to do?'}
                placeholderTextColor={'rgba(255,255,255,1.0)'}
                returnKeyType='done'
                style={[styles.activityTitleInput, this.state.viewStyle, {marginTop: SCREEN_HEIGHT/2.5}]}
                value={this.state.activityTitleInput}/>
        );

        let addInfoButton = (
            <View style={[styles.addInfoButtonContainer, {bottom: (this.state.showNextButton ? 30 : 0)}]}>
                <TouchableOpacity
                    activeOpacity={0.4}
                    onPress={() => {
                            this.refs[ACTIVITY_TITLE_INPUT_REF].blur();
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({activeTimeOption: 'now', date: new Date(), showAddInfoBox: !this.state.showAddInfoBox, tagInput: '', tags: []})
                        }}>
                    <Icon
                        name={this.state.showAddInfoBox ? 'ion|chevron-up' : 'ion|ios-plus'}
                        size={ADD_INFO_BUTTON_SIZE}
                        color='#fff'
                        style={{width: ADD_INFO_BUTTON_SIZE, height: ADD_INFO_BUTTON_SIZE}}
                        />
                </TouchableOpacity>
            </View>
        );

        let nextButton = (
            <View style={styles.nextButtonContainer}>
                <TouchableOpacity
                    activeOpacity={0.4}
                    onPress={this.onSubmitActivity}>
                    <Icon
                        name='ion|arrow-right-b'
                        size={NEXT_BUTTON_SIZE}
                        color='#fff'
                        style={{width: NEXT_BUTTON_SIZE, height: NEXT_BUTTON_SIZE}}
                        />
                </TouchableOpacity>
            </View>
        );

        let trendingItemsCarousel = (
            <View style={styles.trendingItemsCarousel}>
                <Title>TRENDING <Text style={{color: '#ee964b'}}>{this.state.trendingContent}</Text></Title>
                <ScrollView
                    automaticallyAdjustContentInsets={false}
                    centerContent={true}
                    horizontal={true}
                    pagingEnabled={true}
                    directionalLockEnabled={true}
                    onScroll={this.handleScroll}
                    snapToAlignment='center'
                    snapToInterval={64}
                    showsHorizontalScrollIndicator={true}
                    style={[styles.scrollView, styles.horizontalScrollView, {marginTop: 10}]}>
                    {YALIES.map(this._createTrendingItem.bind(null, 'user'))}
                    {EVENTS.map(this._createTrendingItem.bind(null, 'event'))}
                </ScrollView>
            </View>
        );

        if (this.state.showTimeSpecificationOptions)
            content = (
                <View style={styles.timeSpecificationOptions}>
                    <DatePickerIOS
                        date={this.state.date}
                        mode="time"
                        timeZoneOffsetInMinutes={this.state.timeZoneOffsetInHours * 60}
                        onDateChange={this.onDateChange}
                        minuteInterval={5}
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

        else
            content = (
                <View style={styles.addTimeInfoContainer}>
                    <ScrollView
                        automaticallyAdjustContentInsets={false}
                        canCancelContentTouches={false}
                        centerContent={true}
                        contentContainerStyle={{flex: 1, flexDirection: 'row', width: SCREEN_WIDTH * 1.18, alignItems: 'center'}}
                        contentOffset={{x: this.state.contentOffsetXVal, y: 0}}
                        decelerationRate={0.7}
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
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            if(this.state.activeTimeOption === 'specify') this.setState({hasSpecifiedTime: true, showTimeSpecificationOptions: true});
                            else this.setState({activeTimeOption: 'specify'})
                        }}/>
                    </ScrollView>
                    <View style={[styles.scrollbarArrow, (isAtScrollViewStart ? {right: 10} : {left: 10})]}>
                        <ChevronIcon
                            direction={isAtScrollViewStart ? 'right' : 'left'}
                            onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                            this.setState({contentOffsetXVal: (isAtScrollViewStart ? SCREEN_WIDTH/2.5 : 0)})
                            }}/>
                    </View>
                </View>
            );

        tagSelection = (
            <View style={[styles.tagSelection]}>
                <Title fontSize={16}>TAGS</Title>
                <TextInput
                    onFocus={this._onFocus}
                    onBlur={this._onBlur}
                    autoCapitalize='none'
                    autoCorrect={false}
                    maxLength={15}
                    onChangeText={(text) => {
                        this.setState({tagInput: text});
                        if(text[text.length-1] === ',') {
                        let tagsArr = this.state.tagsArr;

                        if(tagsArr.indexOf(text.slice(0, -1)) < 0 && tagsArr.length < 5)
                        tagsArr.push(text.substr(0, text.length-1));

                        this.setState({tagsArr, tagInput: ''});
                    }
                    }}
                    placeholder={'Type tag, then a comma'}
                    placeholderTextColor={'rgba(255,255,255,0.9)'}
                    returnKeyType='done'
                    style={styles.tagsInputText}
                    value={this.state.tagInput}/>
                <ScrollView
                    automaticallyAdjustContentInsets={false}
                    centerContent={true}
                    horizontal={true}
                    directionalLockEnabled={true}
                    showsHorizontalScrollIndicator={true}
                    style={[styles.scrollView, {height: 20}]}>
                    {this.state.tagsArr.map(this._createTag)}
                </ScrollView>
            </View>
        );

        let addInfoBox = (
            <View
                style={[styles.addInfoBox, {bottom: (this.state.hasKeyboardSpace ? SCREEN_HEIGHT/3 : SCREEN_HEIGHT / 35)}]}>
                <Title>WHEN?</Title>
                {content}
                {tagSelection}
            </View>
        );

        let MainLayout = require('../Layouts/MainLayout');

        return (
            // @hmm: passProps ventureId is for MainLayout and not for profile or chat

            <View style={styles.container}>
                <Image
                    source={require('image!HomeBackground')}
                    style={styles.backdrop}>
                    <Header>
                        <ProfilePageIcon style={{opacity: 0.4}}
                                         onPress={() => this._safelyNavigateForward({title: 'Profile', component: MainLayout, passProps: {selected: 'profile', ventureId: this.state.ventureId}})}/>
                        <ChatsListPageIcon style={{opacity: 0.4}}
                                           onPress={() => this._safelyNavigateForward({title: 'Chats', component: MainLayout, passProps: {selected: 'chats', ventureId: this.state.ventureId}})}
                            />
                    </Header>
                    <Logo
                        logoContainerStyle={styles.logoContainerStyle}
                        logoStyle={styles.logoStyle}/>
                    {this.state.showTextInput ? activityTitleInput : <View />}
                    {this.state.showNextButton ? nextButton : <View />}
                    {this.state.showAddInfoButton && !this.state.showTimeSpecificationOptions ? addInfoButton : <View />}
                    {this.state.showAddInfoBox ? addInfoBox : <View/>}
                    {this.state.showTrendingItems && !this.state.showAddInfoBox ? trendingItemsCarousel : <View/>}
                </Image>
            </View>
        );
    }
});

class TrendingItem extends React.Component {
    render() {

        if (this.props.type === 'user')
            return (
                <TouchableOpacity style={styles.trendingItem}>
                    <Image style={styles.trendingUserImg} source={{uri:this.props.uri}}/>
                </TouchableOpacity>
            );

        else
            return (
                <TouchableOpacity style={styles.trendingItem}>
                    <Image style={styles.trendingEventImg} source={{uri:this.props.uri}}/>
                </TouchableOpacity>
            );
    }
}

class Title extends React.Component {
    render() {
        return (
            <Text
                style={[styles.title, {fontSize: this.props.fontSize}, this.props.titleStyle]}>{this.props.children}</Text>
        );
    }
}

var styles = StyleSheet.create({
    activitySelection: {
        height: SCREEN_HEIGHT / 15
    },
    activityTitleInput: {
        height: 52,
        textAlign: 'center',
        fontSize: SCREEN_HEIGHT / 22,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        fontFamily: 'AvenirNextCondensed-UltraLight'
    },
    addInfoBox: {
        position: 'absolute',
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        padding: 2
    },
    addInfoButton: {},
    addInfoButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: SCREEN_WIDTH,
        marginTop: SCREEN_HEIGHT / 40
    },
    addTimeInfoContainer: {},
    backdrop: {
        paddingTop: 30,
        flex: 1,
        alignItems: 'center',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    captionStyle: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    horizontalScrollView: {
        height: 85
    },
    logoContainerStyle: {
        position: 'absolute',
        top: SCREEN_HEIGHT / 6,
        marginHorizontal: (SCREEN_WIDTH - LOGO_WIDTH) / 2
    },
    logoStyle: {
        width: LOGO_WIDTH,
        height: LOGO_HEIGHT
    },
    nextButtonContainer: {
        bottom: 40,
        right: 40,
        alignSelf: 'flex-end'
    },
    scrollbarArrow: {
        position: 'absolute',
        bottom: 12
    },
    scrollView: {
        backgroundColor: 'rgba(0,0,0,0.008)'
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
    tag: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 12,
        paddingHorizontal: SCREEN_WIDTH / 80,
        marginHorizontal: SCREEN_WIDTH / 70,
        paddingVertical: SCREEN_WIDTH / 200,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.4)',
        top: 6
    },
    tagsInputText: {
        top: 5,
        borderWidth: 0.5,
        borderColor: '#0f0f0f',
        backgroundColor: 'rgba(0,0,0,0.8)',
        flex: 1,
        padding: TAG_TEXT_INPUT_PADDING,
        height: SCREEN_HEIGHT / 30,
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    tagSelection: {
        marginVertical: 8,
        height: SCREEN_HEIGHT / 6.1
    },
    timeSpecificationDatePicker: {
        top: 10,
        height: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
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