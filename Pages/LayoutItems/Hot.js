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
    Image,
    PixelRatio,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    } = React;

var Display = require('react-native-device-display');
var Header = require('../../Partials/Header');
var HomeIcon = require('../../Partials/Icons/HomeIcon');
var { Icon, } = require('react-native-icons');
var ReactFireMixin = require('reactfire');

var SCREEN_HEIGHT = Display.height;
var SCREEN_WIDTH = Display.width;

var YALIES = [
    `http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_56,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442206258/Harrison%20Miller.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_52,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442206076/Noah%20Cho.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Sophie%20Dillon.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Titania%20Nguyen.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Ivonne%20Gonzalez.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Brandon%20Sherrod.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Isaak%20Cuenco.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/Jessica%20Nelson.png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,q_46,w_${PixelRatio.getPixelSizeForLayoutSize(64)}/v1442205943/JT%20Flowers.png`
];
var EVENTS = [
    `http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20Venture%20Launch%20Party.png`,
    `http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20Frozen%20Four%20(Center%20-%20Big%20Text).png`,
    `https://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_48,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442894669/Event%20-%20Freshman%20Screw%20(Center%20-%20Big%20Text).png`,
    `http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20Swab%20A%20Cheek.png`,
    `http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20The%20Game%20(Center%20-%20Big%20Text).png`,
    `http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20Freshman%20Screw%20(Center%20-%20Big%20Text).png`,
    `http://res.cloudinary.com/dwnyawluh/image/upload/c_scale,h_${PixelRatio.getPixelSizeForLayoutSize(84)},q_78,w_${PixelRatio.getPixelSizeForLayoutSize(240)}/v1442898929/Event%20-%20YSO%20Halloween%20(Center%20-%20Big%20Text).png`
];

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

var Hot = React.createClass({

    mixins: [ReactFireMixin],

    getInitialState() {
        return {
            events: EVENTS,
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            trendingItems: {},
            yalies: YALIES
        };
    },

    componentWillMount() {
        //let _this = this,
        //    trendingItemsRef = this.state.firebaseRef.child(`trending`);
        //
        //this.bindAsObject(trendingItemsRef, 'trendingItems');
        //
        //trendingItemsRef.once('value', snapshot =>
        //        _this.setState({
        //            events: snapshot.val() && snapshot.val().events,
        //            yalies: snapshot.val() && snapshot.val().yalies
        //        })
        //);
    },

    componentWillUnmount() {

    },

    _createTrendingItem(type, uri, i) {
        return (
            <TrendingItem type={type} key={i} uri={uri}/>
        )

    },

    _safelyNavigateToHome() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
            homeRoute = currentRouteStack[0];

        if (currentRouteStack.indexOf(homeRoute) > -1) this.props.navigator.jumpTo(homeRoute);
    },

    render: function () {
        return (
            <View style={styles.container}>
                {this._renderHeader()}
                <View style={[styles.tabContent, {flex: 1}]}>
                    <View style={styles.trendingItemsCarousel}>
                        <Title>TRENDING <Text style={{color: '#ee964b'}}>YALIES</Text></Title>
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
                            {this.state.yalies && this.state.yalies.map(this._createTrendingItem.bind(null, 'user'))}
                        </ScrollView>
                    </View>

                    <View style={styles.trendingItemsCarousel}>
                        <Title>TRENDING <Text style={{color: '#ee964b'}}>EVENTS</Text></Title>
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
                <HomeIcon onPress={() => this._safelyNavigateToHome()} style={{right: 14, bottom: 5}}/>
                <Text>HOT</Text>
                <Text/>
            </Header>
        )
    }
});

var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF5EA'
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
        height: 85
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
        borderRadius: 3,
        marginHorizontal: SCREEN_WIDTH / 30
    },
    trendingItemsCarousel: {
        width: SCREEN_WIDTH / 1.2,
        alignSelf: 'center',
        justifyContent: 'center',
        marginHorizontal: (SCREEN_WIDTH - (SCREEN_WIDTH / 1.2)) / 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        margin: 20,
        borderRadius: 10
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


module.exports = Hot;