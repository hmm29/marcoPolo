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
    ActionSheetIOS,
    AsyncStorage,
    Image,
    InteractionManager,
    LayoutAnimation,
    NativeModules,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
    } = React;

var _ = require('lodash');
var AutoComplete = require('react-native-autocomplete');
var BackIcon = require('../Partials/Icons/BackIcon');
var Camera = require('react-native-camera');
var Display = require('react-native-device-display');
var Firebase = require('firebase');
var GenderList = require('../data/genders.json').genders;
var Header = require('../Partials/Header');
var { Icon, } = require('react-native-icons');
var MainLayout = require('../Layouts/MainLayout');
var Profile = require('../Pages/LayoutItems/Profile');

var CAMERA_ICON_SIZE = 48;
var CAMERA_REF = 'camera';
var CAMERA_ROLL_OPTION = 'Camera Roll';
var EDIT_GENDER_AUTOCOMPLETE_REF = 'editGenderAutocomplete';
var EDIT_GENDER_ICON_SIZE = 22;
var TAKE_PHOTO_OPTION = 'Take Photo';

var BUTTONS = [
    TAKE_PHOTO_OPTION,
    CAMERA_ROLL_OPTION,
    'Cancel'
];
var CANCEL_INDEX = 3;
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
            cameraType: Camera.constants.Type.back,
            firebaseRef: new Firebase('https://ventureappinitial.firebaseio.com/'),
            hasKeyboardSpace: false,
            showAutocomplete: false,
            showBioField: true,
            showCamera: false,
            isEditingGenderField: false,
            genderMatches: []
        }
    },

    componentWillMount() {
        let ventureId = this.props.passProps.ventureId;

        this.state.firebaseRef.child(`users/${ventureId}`).once('value', snapshot => {

            this.setState({
                currentAge: snapshot.val() && snapshot.val().ageRange && snapshot.val().ageRange.min,
                currentBio: snapshot.val() && snapshot.val().bio,
                currentGender: snapshot.val() && snapshot.val().gender,
                currentFirstName: snapshot.val() && snapshot.val().firstName,
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
        this.setState({
            showAutocomplete: false,
            isEditingGenderField: false,
            hasKeyboardSpace: false,
            showBioField: true
        });
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

    _safelyNavigateToMainLayout() {
        let currentRouteStack = this.props.navigator.getCurrentRoutes(),
        // @hmm navigate back to one of main layout components
            mainLayoutRoute = _.findLast(currentRouteStack, (route) => {
                return route && route.passProps && !! route.passProps.selected;
            });

        if(mainLayoutRoute) this.props.navigator.jumpTo(mainLayoutRoute)
        else this.props.navigator.jumpBack();
    },

    saveData() {

        let ventureId = this.props.passProps.ventureId;

        this.state.firebaseRef.child(`users/${ventureId}/bio`).set(this.state.currentBio);

        if (this.state.selectedGender !== this.state.originalGender)
            this.state.firebaseRef.child(`users/${ventureId}/gender`).set(this.state.selectedGender);

        if (this.state.currentPic !== this.state.originalPic)
            this.state.firebaseRef.child(`users/${ventureId}/picture`).set(this.state.currentPic);

        this._safelyNavigateToMainLayout();
    },

    _setGender(selectedGender:string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
        this.setState({selectedGender: selectedGender});
        this._onBlurGender()
    },

    _showActionSheet() {
        ActionSheetIOS.showActionSheetWithOptions({
                options: BUTTONS,
                cancelButtonIndex: CANCEL_INDEX
            },
            (buttonIndex) => {

                if (BUTTONS[buttonIndex] === TAKE_PHOTO_OPTION) {
                    //@hmm: open React Native camera
                    this.setState({showCamera: true});
                }

                if (BUTTONS[buttonIndex] == CAMERA_ROLL_OPTION) {
                    //@hmm: show camera roll
                    alert('show camera roll');
                }

            });
    },

    _switchCamera() {
        let state = this.state;
        state.cameraType = state.cameraType === Camera.constants.Type.back
            ? Camera.constants.Type.front : Camera.constants.Type.back;
        this.setState(state);
    },

    _takePicture() {
        let _this = this;

        this.refs[CAMERA_REF].capture(function (err, data) {
            console.log(err, data);

            //@hmm: HACK to add base_64 data to camera images
            // See https://medium.com/@scottdixon/react-native-creating-a-custom-module-to-upload-camera-roll-images-7a3c26bac309

            NativeModules.ReadImageData.readImage(data, (image) => {
                _this.setState({currentPic: 'data:image/jpeg;base64,' + image, showCamera: false});
            })
        });
    },

    render() {
        let editBio = (
            <View
                style={styles.editBio}>
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

        let editPhoto = (
            <View>
                <TouchableOpacity
                    // onPress={this._showActionSheet}
                    >
                    <Image source={{isStatic: true, uri: this.state.currentPic}} style={styles.currentPic}/>
                </TouchableOpacity>
            </View>
        );

        let genderField = (
            <View style={styles.genderField}>
                <Text style={styles.label}>{this.state.selectedGender && this.state.selectedGender.capitalize()}</Text>
                <TouchableOpacity onPress={() => {
                    this.setState({isEditingGenderField: true, showAutocomplete: true})
                }}>
                    <Icon
                        color="rgba(255,255,255,0.7)"
                        name="ion|edit"
                        size={EDIT_GENDER_ICON_SIZE}
                        style={{width: EDIT_GENDER_ICON_SIZE * 1.4, height: EDIT_GENDER_ICON_SIZE * 1.4}}
                        />
                </TouchableOpacity>
            </View>
        );

        let genderAutocomplete = (
            <View style={styles.genderAutocomplete}>
                <AutoComplete
                    ref={EDIT_GENDER_AUTOCOMPLETE_REF}
                    autoCompleteTableCellTextColor={'#fff'}
                    autoCompleteTableOriginOffset={0}
                    autoCompleteTableViewHidden={false}
                    showTextFieldDropShadowWhenAutoCompleteTableIsOpen={false}
                    autoCompleteRowHeight={34}
                    onBlur={this._onBlurGender}
                    onFocus={this._onFocusGender}
                    clearTextOnFocus={true}
                    placeholder='How do you identify?'
                    autoCompleteFontSize={15}
                    autoCompleteRegularFontName='AvenirNextCondensed-Regular'
                    autoCompleteBoldFontName='AvenirNextCondensed-Medium'
                    applyBoldEffectToAutoCompleteSuggestions={true}
                    onSelect={this._setGender}
                    onTyping={this._onTyping}
                    suggestions={this.state.genderMatches}
                    textAlign='center'
                    style={[styles.autocomplete, {height: 40, marginRight: (this.state.showBioField ? 0 : 90)}]}
                    />
            </View>
        );


        return this.state.showCamera ?

            <Camera
                ref={CAMERA_REF}
                style={styles.cameraContainer}
                type={this.state.cameraType}>
                <View style={{flexDirection: 'row'}}>
                    <TouchableOpacity onPress={this._takePicture}>
                        <Icon
                            color="#fff"
                            name="ion|ios-camera"
                            size={CAMERA_ICON_SIZE}
                            style={{width: CAMERA_ICON_SIZE, height: CAMERA_ICON_SIZE, paddingHorizontal: SCREEN_WIDTH/5}}
                            />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this._switchCamera}>
                        <Icon
                            color="#fff"
                            name="ion|ios-reverse-camera"
                            size={CAMERA_ICON_SIZE}
                            style={{width: CAMERA_ICON_SIZE, height: CAMERA_ICON_SIZE, paddingHorizontal: SCREEN_WIDTH/5}}
                            />
                    </TouchableOpacity>
                </View>
            </Camera>

            :

            <View style={styles.container}>
                <View>
                    {this._renderHeader()}
                </View>
                <View style={{bottom: this.state.hasKeyboardSpace ? SCREEN_HEIGHT/ 3 : 0}}>
                    <Image source={require('image!about')} style={styles.backdrop}>

                        {editPhoto}

                        <Text
                            style={[styles.label, {fontSize: 22}]}>{this.state.currentFirstName} {this.state.currentFirstName ? ',' : ''} {this.state.currentAge}</Text>

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
    },

    _renderHeader() {
        return (
            <Header containerStyle={{backgroundColor: '#040A19'}}>
                <TouchableOpacity onPress={this._safelyNavigateToMainLayout} style={{right: 40}}>
                    <Icon
                        color="#fff"
                        name="ion|ios-arrow-thin-left"
                        size={32}
                        style={{width: 32, height: 32, left: 20}} />
                </TouchableOpacity>
                <Text
                    style={styles.headerTitle}>
                    EDIT PROFILE </Text>
                <Text />
            </Header>
        )
    }
});

var styles = StyleSheet.create({
    autocomplete: {
        backgroundColor: 'rgba(9,24,58,0.3)',
        color: '#fff',
        width: SCREEN_WIDTH / 2,
        borderRadius: 10,
        marginBottom: SCREEN_HEIGHT / 22,
        left: 60,
        alignSelf: 'stretch'
    },
    backdrop: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
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
    cameraContainer: {
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 20
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
    editBio: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10,
        justifyContent: 'space-between',
        bottom: 30
    },
    genderAutocomplete: {
        margin: 10
    },
    genderField: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 10
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