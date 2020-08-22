import React, { FunctionComponent, useState } from 'react'
import { StyleSheet, Dimensions, View, Text, TouchableOpacity, Alert } from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'

import { RootStackParamList } from '../../App'

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>

const HomeScreen:FunctionComponent<{navigation: HomeScreenNavigationProp}> = ({ navigation }) => {
    const [webSocketConnection, setWebSocketConnection] = useState(undefined)

    const _summonADoctor = () => {
        const ws = new WebSocket('wss://echo.websocket.org');

        ws.onopen = () => {
            console.log('WEBSOCKET CONNECTION OPENED')
            ws.send('echo'); 
        };

        ws.onmessage = (e) => {
            Alert.alert('WebSocket Message Recieved', e.data)
            console.log('WEBSOCKET MESSAGE RECIEVED: ', e.data);
        };

        ws.onerror = (e) => {
            console.log('WEBSOCKET ERROR: ', e.message);
        };

        ws.onclose = (e) => {
            console.log('WEBSOCKET CLOSED: ', e.code, e.reason);
        };
    }

    return(
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.navigate('Questionnaire')} style={styles.button}>
                <Text style={styles.buttonText}>Questionnaire</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Answers')} style={styles.middleButton}>
                <Text style={styles.buttonText}>Previous Answers</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => _summonADoctor()} style={styles.button}>
                <Text style={styles.buttonText}>Summon a Doctor</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 20,
        height: Dimensions.get('window').height
    },
    button: {
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        backgroundColor: '#5093FE'
    },
    middleButton: {
        height: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2,
        backgroundColor: '#5093FE',
        marginTop: 20,
        marginBottom: 20
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600'
    }
})

export default HomeScreen