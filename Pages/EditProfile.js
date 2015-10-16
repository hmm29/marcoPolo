/**
 * Copyright (c) 2015-present, Venture Applications, LLC.
 * All rights reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Harrison Miller <hmaxmiller@gmail.com>, September 2015
 *
 * @providesModule EditProfile
 * @flow
 */

var React = require('react-native');

var {
    AsyncStorage,
    Image,
    InteractionManager,
    LayoutAnimation,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
    } = React;

var _ = require('lodash');
var AutoComplete = require('react-native-autocomplete');
var BackIcon = require('../Partials/Icons/BackIcon');
var Display = require('react-native-device-display');
var Firebase = require('firebase');
var GenderList = require('../data/genders.json').genders;
var Header = require('../Partials/Header');
var { Icon, } = require('react-native-icons');
var MainLayout = require('../Layouts/MainLayout');
var Profile = require('../Pages/LayoutItems/Profile');

var SCREEN_WIDTH = Display.width;
var SCREEN_HEIGHT = Display.height;

String.prototype.capitalize = () => this.replace(/(?:^|\s)\S/g, a => a.toUpperCase());

var EditProfile = React.createClass({
    statics: {
        title: '<EditProfile>',
        description: 'Edit current user info.'
    },

    getInitialState() {
        return {
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            hasKeyboardSpace: false,
            showAutocomplete: false,
            showBioField: true,
            isEditingGenderField: false,
            genderMatches: []
        }
    },

    componentWillMount() {
            let ventureId = this.props.passProps.ventureId;

            this.state.firebaseRef.child(`users/${ventureId}`).once('value', snapshot => {

                this.setState({
                    currentAge: snapshot.val() && snapshot.val().ageRange && snapshot.val().ageRange.exactVal,
                    currentBio: snapshot.val() && snapshot.val().bio,
                    currentGender: snapshot.val() && snapshot.val().gender,
                    currentName: snapshot.val() && snapshot.val().name,
                    currentPic: snapshot.val() && snapshot.val().picture,
                    originalBio: snapshot.val() && snapshot.val().bio,
                    originalGender: snapshot.val() && snapshot.val().gender,
                    originalPic: snapshot.val() && snapshot.val().picture,
                    selectedGender: snapshot.val() && snapshot.val().gender,
                    ventureId
                });

            });
    },

    _onBlurBio() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({hasKeyboardSpace: false});
    },

    _onFocusBio() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({hasKeyboardSpace: true})
    },

    _onBlurGender() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({showAutocomplete: false, isEditingGenderField: false, hasKeyboardSpace: false, showBioField: true});
    },

    _onFocusGender() {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({showAutocomplete: true, isEditingGenderField: true, hasKeyboardSpace: true, showBioField: false})
    },


    _onTyping(text:string) {
        let genderMatches =
            _.filter(GenderList, n => _.startsWith(n.toLowerCase(), text.toLowerCase()));

        this.setState({genderMatches});
    },

    _safelyNavigateToProfile() {
            this.props.navigator.pop();
    },

    _setGender(selectedGender:string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({selectedGender: selectedGender});
        this._onBlurGender()
    },

    saveData() {

        let ventureId = this.props.passProps.ventureId;

        this.state.firebaseRef.child(`users/${ventureId}/bio`).set(this.state.currentBio);

        if (this.state.selectedGender !== this.state.originalGender)
            this.state.firebaseRef.child(`users/${ventureId}/gender`).set(this.state.selectedGender);

        if (this.state.currentPic !== this.state.originalPic)
            this.state.firebaseRef.child(`users/${ventureId}/picture`).set(this.state.currentPic);

        this._safelyNavigateToProfile();
    },

    render() {
        let editBio = (
            <View
                style={{flexDirection: 'row', alignItems: 'center', margin: 10, justifyContent: 'space-between', bottom: 30}}>
                <Text
                    style={styles.label}>Bio</Text>
                <TextInput
                    onBlur={this._onBlurBio}
                    onFocus={this._onFocusBio}
                    autoCapitalize='none'
                    autoCorrect={false}
                    onChangeText={(text) => this.setState({currentBio: text})}
                    maxLength={15}
                    returnKeyType='done'
                    style={styles.bio}
                    value={this.state.currentBio}/>
            </View>
        );

        let genderField = (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 10}}>
                <Text style={styles.label}>{this.state.selectedGender && this.state.selectedGender.capitalize()}</Text>
                <TouchableOpacity onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                    this.setState({isEditingGenderField: true, showAutocomplete: true})
                }}>
                    <Icon
                        color="rgba(255,255,255,0.7)"
                        name="ion|edit"
                        size={22}
                        style={{width: 18, height: 18}}
                        />
                </TouchableOpacity>
            </View>
        );

        let genderAutocomplete = (
            <View style={{margin: 10}}>
                <AutoComplete
                    onBlur={this._onBlurGender}
                    onFocus={this._onFocusGender}
                    clearTextOnFocus={true}
                    placeholder='Edit gender'
                    autoCompleteFontSize={15}
                    autoCompleteRegularFontName='AvenirNextCondensed-Regular'
                    autoCompleteBoldFontName='AvenirNextCondensed-Medium'
                    applyBoldEffectToAutoCompleteSuggestions={true}
                    onSelect={this._setGender}
                    onTyping={this._onTyping}
                    suggestions={this.state.genderMatches}
                    autoCompleteTableCellTextColor={'#fff'}
                    autoCompleteTableOriginOffset={0}
                    autoCompleteTableViewHidden={false}
                    showTextFieldDropShadowWhenAutoCompleteTableIsOpen={false}
                    autoCompleteRowHeight={34}
                    style={[styles.autocomplete, {height: (this.state.isEditingGenderField ? SCREEN_WIDTH / 9 : 40), marginRight: (this.state.showBioField ? 0 : 90), paddingBottom: (this.state.showBioField ? 0 : 60) }]}
                    />
            </View>
        );


        return (
            <View style={styles.container}>
                <View>
                    {this._renderHeader()}
                </View>
                <View style={{bottom: this.state.hasKeyboardSpace ? SCREEN_HEIGHT/ 3 : 0}}>
                    <Image source={require('image!about')} style={styles.backdrop}>
                        <Image source={{uri: this.state.currentPic}} style={styles.currentPic}/>
                        <Text
                            style={[styles.label, {fontSize: 22}]}>{this.state.currentName} {this.state.currentName ? ',' : ''} {this.state.currentAge}</Text>

                        <View style={styles.editableTextFields}>
                            {this.state.isEditingGenderField && this.state.showAutocomplete ? genderAutocomplete : genderField}

                            {this.state.showBioField ? editBio : <View />}

                        </View>
                        <TouchableOpacity onPress={this.saveData}
                                          style={[styles.saveButton, {top: (this.state.showBioField ? 10 : 60)}]}>
                            <Text style={styles.saveButtonText}>S A V E</Text>
                        </TouchableOpacity>
                    </Image>
                </View>
            </View>
        )
    },

    _renderHeader() {
        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={() => this._safelyNavigateToProfile()} style={{right: 30}}>
                    <Icon
                        color="#fff"
                        name="ion|ios-arrow-thin-left"
                        size={32}
                        style={{width: 32, height: 32}}
                        />
                </TouchableOpacity>
                <Text
                    style={{color: '#fff', right: 10, fontSize: 22, paddingVertical: 10, fontFamily: 'AvenirNextCondensed-Medium'}}>
                    EDIT PROFILE </Text>
                <Text />
            </View>
        )
    }
});

var styles = StyleSheet.create({
    autocomplete: {
        backgroundColor: 'rgba(9,24,58,0.3)',
        color: '#fff',
        width: SCREEN_WIDTH / 2,
        borderRadius: 10,
        paddingLeft: SCREEN_WIDTH / 25,
        marginBottom: SCREEN_HEIGHT / 22,
        left: 60,
        alignSelf: 'stretch'
    },
    backdrop: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: SCREEN_HEIGHT / 14
    },
    bio: {
        backgroundColor: 'rgba(9, 24, 58,0.2)',
        width: SCREEN_WIDTH / 2,
        height: SCREEN_WIDTH / 8,
        borderRadius: 10,
        paddingLeft: SCREEN_WIDTH / 25,
        alignSelf: 'center',
        marginVertical: SCREEN_HEIGHT / 90,
        fontFamily: 'AvenirNextCondensed-Regular',
        color: 'white'
    },
    container: {
        flex: 1
    },
    currentPic: {
        width: SCREEN_WIDTH / 1.8,
        height: SCREEN_WIDTH / 1.8,
        borderRadius: SCREEN_WIDTH / 3.6,
        bottom: 10
    },
    editableTextFields: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        right: 10,
        bottom: 15
    },
    header: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#040A19',
        paddingTop: 20,
        paddingBottom: 5
    },
    label: {
        color: 'white',
        fontSize: SCREEN_HEIGHT / 44,
        margin: SCREEN_HEIGHT / 30,
        fontFamily: 'AvenirNextCondensed-Regular'
    },
    saveButton: {
        backgroundColor: '#040A19',
        alignSelf: 'center',
        borderRadius: 4,
        paddingHorizontal: 30,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'AvenirNextCondensed-Medium'
    }
});

module.exports = EditProfile;