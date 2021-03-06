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
import { Button } from 'react-native-elements';
import awsmobile from '../../aws-exports';
import API from '../../lib/Categories/API';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { colors } from 'theme';
import Storage from '../../lib/Categories/Storage';

class ViewItemSell extends React.PureComponent {
  static navigationOptions = ({ navigation, screenProps }) => console.log(screenProps) || ({
    title: `Viewing ${navigation.state.params.item.name}`,
  })
    async handleDeletePet(petId) {
    const cloudLogicArray = JSON.parse(awsmobile.aws_cloud_logic_custom);
    const endPoint = cloudLogicArray[0].endpoint;
    const requestParams = {
      method: 'DELETE',
      url: `${endPoint}/items/pets/${petId}`,
    }

    try {
      await API.restRequest(requestParams);

      this.props.navigation.navigate('Sell');
    } catch (err) {
      console.log(err);
    }
  }
  render() {
    const { item } = this.props.navigation.state.params;

    const uri = item.picKey ? Storage.getObjectUrl(item.picKey) : null;

    const dob = new Date(item.dob);
    const years = (new Date()).getFullYear() - dob.getFullYear();
    const birthDay = `${years} years old, ${dob.getMonth() + 1}/${dob.getDate()}/${dob.getFullYear()}`;

    return (
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <Image
            style={styles.image}
            source={uri ? { uri } : require('../../assets/images/profileicon.png')}
          />
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{item.name || 'No name'}</Text>
            <Text style={styles.info}>{'$'+item.price || 'No price'}</Text>
            <Text style={styles.info}>{item.type || 'No type'}</Text>

          </View>
        </View>
        <View style={styles.breaker} />
        <Button
          fontFamily='lato'
          backgroundColor={colors.red}
          large
          title="DELETE ITEM"
          onPress={this.handleDeletePet.bind(this, item.petId)} />
      </View>
    );
  }
}

const imageSize = 130;
const styles = StyleSheet.create({
  infoContainer: {
    paddingLeft: 20,
  },
  breaker: {
    height: 1,
    backgroundColor: colors.darkGray,
    marginVertical: 15,
    width: '100%',
  },
  topContainer: {
    flexDirection: 'row',
  },
  container: {
    padding: 20,
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
  },
  title: {
    color: colors.darkGray,
    fontSize: 28,
    marginBottom: 20,
  },
  info: {
    color: colors.darkGray,
    marginBottom: 7,
  },
});

export default ViewItemSell;
