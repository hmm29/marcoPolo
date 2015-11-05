/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule Hot
 * @flow
 */

'use strict';

var React = require('react-native');
var {
    Animated,
    Image,
    LayoutAnimation,
    PixelRatio,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    } = React;

var ChevronIcon = require('../../Partials/Icons/ChevronIcon');
var Dimensions = require('Dimensions');
var Header = require('../../Partials/Header');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var { Icon, } = require('react-native-icons');
var ReactFireMixin = require('reactfire');
var TimerMixin = require('react-timer-mixin');

var SCREEN_HEIGHT = Dimensions.get('window').height;
var SCREEN_WIDTH = Dimensions.get('window').width;

class Title extends React.Component {
    render() {
        return (
            <Text
                style={[styles.title, {fontSize: this.props.fontSize}, this.props.titleStyle]}>{this.props.children}</Text>
        );
    }
}

var Hot = React.createClass({
    propTypes: {
      handleSelectedTabChange: React.PropTypes.func.isRequired
    },

    mixins: [TimerMixin, ReactFireMixin],

    getInitialState() {
        return {
            events: [],
            fadeAnim: new Animated.Value(0),
            firebaseRef: this.props.firebaseRef,
            trendingItems: {},
            yalies: []
        };
    },

    componentWillMount() {
        let _this = this,
            trendingItemsRef = this.state.firebaseRef.child('trending');

        trendingItemsRef.once('value', snapshot => {
                _this.setState({
                    events: snapshot.val() && snapshot.val().events,
                    yalies: snapshot.val() && snapshot.val().yalies,
                    trendingItemsRef
                });
                _this.startAnimation();
            }
        );
    },

    componentWillUnmount() {
        this.state.trendingItemsRef && this.state.trendingItemsRef.off();
    },

    startAnimation() {
        Animated.timing(this.state.fadeAnim, {
            toValue: 1,
            duration: 1000,
        }).start();

        this.setTimeout(() => {
            Animated.timing(this.state.fadeAnim, {
                toValue: 0,
                duration: 500,
            }).start();

            this.setTimeout(() => {
                Animated.timing(this.state.fadeAnim, {
                    toValue: 1,
                    duration: 1000,
                }).start();

                this.setTimeout(() => {
                    Animated.timing(this.state.fadeAnim, {
                        toValue: 0,
                        duration: 500,
                    }).start();

                    this.setTimeout(() => {
                        Animated.timing(this.state.fadeAnim, {
                            toValue: 1,
                            duration: 1000,
                        }).start();

                        this.setTimeout(() => {
                            Animated.timing(this.state.fadeAnim, {
                                toValue: 0.15,
                                duration: 500,
                            }).start();

                        }, 1000);

                    }, 1000);

                }, 1000);

            }, 1000);


        }, 1000);

    },

    _createTrendingItem(type, uri, i) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

        if(type === 'user') return (
            <TouchableOpacity key={i} style={styles.trendingItem}>
                <Image style={styles.trendingUserImg} source={{uri}}/>
            </TouchableOpacity>
        )

        return (
            <TouchableOpacity key={i} onPress={() => this.props.handleSelectedTabChange('events')} style={styles.trendingItem}>
                <Image style={styles.trendingEventImg} source={{uri}}/>
            </TouchableOpacity>
        )

    },

    _safelyNavigateToHome() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
            homeRoute = currentRouteStack[0];

        if (currentRouteStack.indexOf(homeRoute) > -1) this.props.navigator.jumpTo(homeRoute);
    },

    render() {
        return (
            <View style={styles.container}>
                {this._renderHeader()}
                <View style={[styles.tabContent, {flex: 1}]}>
                    <View style={[styles.trendingItemsCarousel, {height: SCREEN_HEIGHT / 5}]}>
                        <Title>TRENDING <Text style={{color: '#ee964b'}}>YALIES</Text></Title>
                        <ScrollView
                            automaticallyAdjustContentInsets={false}
                            horizontal={true}
                            pagingEnabled={true}
                            directionalLockEnabled={true}
                            onScroll={this.handleScroll}
                            snapToAlignment='center'
                            snapToInterval={64}
                            showsHorizontalScrollIndicator={true}
                            style={[styles.scrollView, styles.horizontalScrollView, {marginTop: 10}]}>
                            {this.state.yalies && this.state.yalies.map(this._createTrendingItem.bind(null, 'user'))}
                        </ScrollView>
                        <View style={[styles.scrollbarArrow, {top: SCREEN_HEIGHT / 10.6, left: SCREEN_WIDTH / 1.20, backgroundColor: 'transparent'}]}>
                            <Animated.View style={{opacity: this.state.fadeAnim}}>
                            <ChevronIcon
                                color='rgba(255,255,255,0.8)'
                                size={20}
                                direction={'right'}/>
                            </Animated.View>
                        </View>
                    </View>

                    <View style={styles.trendingItemsCarousel}>
                        <Title>TRENDING <Text style={{color: '#ee964b'}}>EVENTS</Text></Title>
                        <ScrollView
                            automaticallyAdjustContentInsets={false}
                            horizontal={true}
                            pagingEnabled={true}
                            directionalLockEnabled={true}
                            onScroll={this.handleScroll}
                            snapToAlignment='center'
                            snapToInterval={SCREEN_WIDTH / 1.3}
                            showsHorizontalScrollIndicator={true}
                            style={[styles.scrollView, styles.horizontalScrollView, {marginTop: 10}]}>
                            {this.state.events && this.state.events.map(this._createTrendingItem.bind(null, 'event'))}
                        </ScrollView>
                    </View>
                </View>
                <View style={{height: 48}} />
            </View>
        );
    },

    _renderHeader() {
        return (
            <Header containerStyle={{backgroundColor: '#040A19'}}>
                <HomeIcon onPress={() => this._safelyNavigateToHome()} style={{right: 14}}/>
                <Text>HOT</Text>
                <Text/>
            </Header>
        )
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#040A19',
        paddingTop: 20,
        paddingBottom: 5
    },
    headerTitle: {
        color: '#fff',
        fontSize: 22,
        paddingVertical: 10,
        fontFamily: 'AvenirNextCondensed-Medium'
    },
    horizontalScrollView: {
        height: 125
    },
    scrollbarArrow: {
        position: 'absolute',
    },
    scrollView: {
        backgroundColor: 'rgba(0,0,0,0.008)'
    },
    tabContent: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: {
        color: 'white',
        margin: 50
    },
    title: {
        color: '#fff',
        fontFamily: 'AvenirNextCondensed-Regular',
        fontSize: 20,
        textAlign: 'center',
        paddingTop: 5
    },
    trendingItems: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    trendingItem: {
        borderRadius: 3
    },
    trendingItemsCarousel: {
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        justifyContent: 'center',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        padding: 10,
        margin: 20,
        borderRadius: 10
    },
    trendingUserImg: {
        width: SCREEN_WIDTH / 5.2,
        height: 64,
        marginHorizontal: SCREEN_WIDTH/30,
        resizeMode: 'contain'
    },
    trendingEventImg: {
        width: SCREEN_WIDTH / 1.3,
        height: 110,
        resizeMode: 'contain'
    }
});


module.exports = Hot;