/*
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
import React from 'react';
import {
  View,
  Text,
  CameraRoll,
  StyleSheet,
  TouchableWithoutFeedback,
  Modal,
  Dimensions,
  Image,
  ScrollView,
  ImageStore,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  FormLabel,
  FormInput,
  FormValidationMessage,
  Button,
  Icon,
  ButtonGroup,
} from 'react-native-elements';
import RNFetchBlob from 'react-native-fetch-blob';
import uuid from 'react-native-uuid';
import mime from 'mime-types';

import { colors } from 'theme';
import Auth from '../../lib/Categories/Auth';
import API from '../../lib/Categories/API';
import Storage from '../../lib/Categories/Storage';
import files from '../Utils/files';
import awsmobile from '../../aws-exports';
import DatePicker from '../Components/DatePicker';

const { width, height } = Dimensions.get('window');

let styles = {};

var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

class AddItem extends React.Component {
  static navigationOptions = {
    title: 'Add Item',
  }

  state = {
    selectedImage: {},
    selectedImageIndex: null,
    images: [],
    selectedTypeIndex: null,
    modalVisible: false,
    input: {
      name: '',
      dob: null,
      price: '',
      type: '',
      breed: '',
    },
    showActivityIndicator: false,
  }

  updateSelectedImage = (selectedImage, selectedImageIndex) => {
    if (selectedImageIndex === this.state.selectedImageIndex) {
      this.setState({
        selectedImageIndex: null,
        selectedImage: {}
      })
    } else {
      this.setState({
        selectedImageIndex,
        selectedImage,
      });
    }
  }

  updateInput = (key, value) => {
    this.setState((state) => ({
      input: {
        ...state.input,
        [key]: value,
      }
    }))
  }

  getPhotos = () => {
    CameraRoll
      .getPhotos({
        first: 20,
      })
      .then(res => {
        this.setState({ images: res.edges })
        this.props.navigation.navigate('UploadPhoto', { data: this.state, updateSelectedImage: this.updateSelectedImage })
      })
      .catch(err => console.log('error getting photos...:', err))
  }

  toggleModal = () => {
    this.setState(() => ({ modalVisible: !this.state.modalVisible }))
  }

  readImage(imageNode = null) {
    if (imageNode === null) {
      return Promise.resolve();
    }

    const { image } = imageNode;
    const result = {};

    if (Platform.OS === 'ios') {
      result.type = mime.lookup(image.filename);
    } else {
      result.type = imageNode.type;
    }

    const extension = mime.extension(result.type);
    const imagePath = image.uri;
    const picName = `${uuid.v1()}.${extension}`;
    const userId = AWS.config.credentials.data.IdentityId;
    const key = `private/${userId}/${picName}`;

    return files.readFile(imagePath)
      .then(buffer => Storage.putObject(key, buffer, result.type))
      .then(fileInfo => ({ key: fileInfo.key }))
      .then(x => console.log('SAVED', x) || x);
  }
  success = (pos) => {
    const itemInfo = this.state.input;
    const { node: imageNode } = this.state.selectedImage;

    this.setState({ showActivityIndicator: true });

    this.readImage(imageNode)
      .then(fileInfo => ({
        ...itemInfo,
        picKey: fileInfo && fileInfo.key,
      }))
      .then(this.apiSaveItem)
      .then(data => {
        this.setState({ showActivityIndicator: false });
        this.props.screenProps.handleRetrieveItem();
        this.props.screenProps.toggleModal();
      })
      .catch(err => {
        console.log('error saving item...', err);
        this.setState({ showActivityIndicator: false });
      });
  }
  error = (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  }
  AddItem = () => {
    navigator.geolocation.getCurrentPosition(this.success, this.error, options);
  }

  apiSaveItem(item) {
    const cloudLogicArray = JSON.parse(awsmobile.aws_cloud_logic_custom);
    const endPoint = cloudLogicArray[0].endpoint;
    const requestParams = {
      method: 'POST',
      url: endPoint + '/items/pets',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(item),
    }

    return API.restRequest(requestParams);
  }

  updateType = (index) => {
    let type = 'furniture';
    if (index === this.state.selectedTypeIndex) {
      index = null;
      type = '';
    }
    else if (index === 1) {
      type = 'technology';
    }
    else if (index === 2) {
      type = 'clothes';
    }
    this.setState((state) => ({
      selectedTypeIndex: index,
      input: {
        ...state.input,
        type,
      }
    }))
  }


  render() {
    const { selectedImageIndex, selectedImage, selectedTypeIndex } = this.state;

    return (
      <View style={{ flex: 1, paddingBottom: 0 }}>
        <ScrollView style={{ flex: 1 }}>
          <Text style={styles.title}>Add New Item</Text>
          <TouchableWithoutFeedback
            onPress={this.getPhotos}
          >
            {
              selectedImageIndex === null ? (
                <View style={styles.addImageContainer}>
                  <Icon size={34} name='camera-roll' color={colors.grayIcon} />
                  <Text style={styles.addImageTitle}>Upload Photo</Text>
                </View>
              ) : (
                  <Image
                    style={styles.addImageContainer}
                    source={{ uri: selectedImage.node.image.uri }}
                  />
                )
            }

          </TouchableWithoutFeedback>
          <FormLabel>Name</FormLabel>
          <FormInput
            inputStyle={styles.input}
            selectionColor={colors.primary}
            autoCapitalize="none"
            autoCorrect={false}
            underlineColorAndroid="transparent"
            editable={true}
            placeholder="Please enter your item's name"
            returnKeyType="next"
            ref="name"
            textInputRef="nameInput"
            onChangeText={(name) => this.updateInput('name', name)}
            value={this.state.input.name}
          />
          <FormLabel>Price</FormLabel>
          
          <FormInput
            inputStyle={styles.input}
            selectionColor={colors.primary}
            autoCapitalize="none"
            autoCorrect={false}
            underlineColorAndroid="transparent"
            editable={true}
            placeholder="Please enter your item price"
            returnKeyType="next"
            ref="price"
            textInputRef="priceInput"
            onChangeText={(price) => this.updateInput('price', price)}
            value={this.state.input.price}
          />

          <FormLabel>Type</FormLabel>
          <View style={styles.buttonGroupContainer}>
            <ButtonGroup
              innerBorderStyle={{ width: 0.5 }}
              underlayColor='#0c95de'
              containerStyle={{ borderColor: '#d0d0d0' }}
              selectedTextStyle={{ color: 'white', fontFamily: 'lato' }}
              selectedBackgroundColor={colors.primary}
              onPress={this.updateType}
              selectedIndex={this.state.selectedTypeIndex}
              buttons={['furniture', 'technology', 'clothes']}
            />
          </View>
          <Button
            fontFamily='lato'
            containerViewStyle={{ marginTop: 20 }}
            backgroundColor={colors.primary}
            large
            title="Add Item"
            onPress={this.AddItem}
          />
          <Text
            onPress={this.props.screenProps.toggleModal}
            style={styles.closeModal}>Dismiss</Text>
        </ScrollView>
        <Modal
          visible={this.state.showActivityIndicator}
          onRequestClose={() => null}
        >
          <ActivityIndicator
            style={styles.activityIndicator}
            size="large"
          />
        </Modal>
      </View>
    );
  }
}

styles = StyleSheet.create({
  buttonGroupContainer: {
    marginHorizontal: 8,
  },
  addImageContainer: {
    width: 120,
    height: 120,
    backgroundColor: colors.lightGray,
    borderColor: colors.mediumGray,
    borderWidth: 1.5,
    marginVertical: 14,
    borderRadius: 60,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageTitle: {
    color: colors.darkGray,
    marginTop: 3,
  },
  closeModal: {
    color: colors.darkGray,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    marginLeft: 20,
    marginTop: 19,
    color: colors.darkGray,
    fontSize: 18,
    marginBottom: 15,
  },
  input: {
    fontFamily: 'lato',
  },
  activityIndicator: {
    backgroundColor: colors.mask,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default AddItem;
