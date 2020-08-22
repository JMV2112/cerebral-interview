import React, { useState, useEffect, FunctionComponent } from 'react'
import { StyleSheet, Dimensions, View, Text, ScrollView } from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import AsyncStorage from '@react-native-community/async-storage'

import { RootStackParamList } from '../../App'
import { KEYS } from '../constants'
import { Question } from './questionnaire'

const doctorsName = 'Jane Doe'

type AnswersScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Answers'>

const AnswersScreen:FunctionComponent<{navigation: AnswersScreenNavigationProp}> = ({ navigation }) => {
    const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false)
    const [questionnaire, setQuestionnaire] = useState(undefined)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        AsyncStorage.getItem(KEYS.hasCompletedQuestionnaire)
            .then(response => {
                if (response) {
                    setHasCompletedQuestionnaire(Boolean(response))

                    AsyncStorage.getItem(KEYS.questionnaire)
                        .then(questionnaireResponse => {
                            if (questionnaireResponse) {
                                setQuestionnaire(JSON.parse(questionnaireResponse))
                            } else {
                                setHasError(true)
                            }
                        })
                        .catch(err => {
                            console.log('ERROR RETRIEVING QUESTIONNAIRE')
                            setHasError(true)
                        })
                } else {
                    setHasCompletedQuestionnaire(false)
                }

                if (hasCompletedQuestionnaire) {
                    AsyncStorage.getItem(KEYS.questionnaire)
                        .then(res => {
                            if (res) {
                                setQuestionnaire(res)
                            }
                        })
                        .catch(err => {
                            console.log('ERROR RETRIEVEING questionnaire: ', err)
                            setHasError(true)
                        })
                }
            })
            .catch(err => {
                console.log('ERROR RETRIEVING hasCompletedQuestionnaire: ', err)
                setHasError(true)
            })
    }, [])
    
    return(
        <View style={styles.container}>
            {
                hasError ? (
                    <View style={styles.errorWrapper}>
                        <Text style={styles.errorMessage}>Something went wrong, try completing the questionnaire.</Text>
                    </View>
                ) : hasCompletedQuestionnaire && questionnaire && questionnaire.length ? (
                    <View style={styles.body}>
                        <ScrollView>
                            {
                                questionnaire.map((questionOrResponse, index) => {
                                    const key = typeof questionOrResponse === 'string' ? `${index}-${questionOrResponse}` : (questionOrResponse as Question).id
                                    const isResponse = typeof questionOrResponse === 'string'
                                    const textContent = isResponse ? questionOrResponse : (questionOrResponse as Question).question

                                    return(
                                        <View key={key} style={styles.questionResponseWrapper}>
                                            <Text style={isResponse ? styles.usersName : styles.doctorsName}>{isResponse ? 'You:' : `${doctorsName}:`}</Text>
                                            <Text style={styles.response}>{textContent}</Text>
                                        </View>
                                    )
                                })
                            }
                        </ScrollView>
                    </View>
                ) : (
                    <View style={styles.errorWrapper}>
                        <Text style={styles.errorMessage}>Please Complete Questionnaire</Text>
                    </View>
                )
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        backgroundColor: '#FFFFFF',
        height: Dimensions.get('window').height
    },
    errorWrapper: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: Dimensions.get('window').height
    },
    errorMessage: {
        fontWeight: 'bold',
        fontSize: 16
    },
    body: {
        backgroundColor: '#FFFFFF',
        marginLeft: 30,
        marginRight: 30,
        marginTop: 30,
        marginBottom: 30,
        height: Dimensions.get('window').height - 100
    },
    doctorsName: {
        color: '#6B7C90',
        fontSize: 16,
        fontWeight: 'bold'
    },
    usersName: {
        color: '#79ABFE',
        fontSize: 16,
        fontWeight: 'bold'
    },
    questionResponseWrapper: {
        marginTop: 10,
        marginBottom: 10
    },
    response: {
        color: '#D0D1D3',
        fontSize: 14
    }
})

export default AnswersScreen