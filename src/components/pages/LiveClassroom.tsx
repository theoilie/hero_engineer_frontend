import React, { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

import { Button, Form, Collapse, Empty } from "antd"
import { useForm } from "antd/es/form/Form"

import { RootState } from "../../app/rootReducer"

import {
  loadActiveShortAnswerAssignment,
  saveGradedShortAnswerAssignment
} from "../../features/shortAnswerAssignmentsSlice"
import { CheckCircleTwoTone, LoadingOutlined } from "@ant-design/icons/lib"

import "./LiveClassroom.scss"
import TextArea from "antd/es/input/TextArea"
import {
  GradedShortAnswerAssignmentModel,
  GradedShortAnswerQuestionModel,
  ShortAnswerAssignmentModel
} from "../../api/shortAnswerAssignmentsAPI"

export const LiveClassroom = () => {
  const dispatch = useDispatch()
  const [firstLoad, setFirstLoad] = useState(true);
  const { user } = useSelector(
    (state: RootState) => state.user
  )
  const { activeAssignment, activeAssignmentLoading, activeAssignmentError, assignmentSubmitting } = useSelector(
    (state: RootState) => state.shortAnswerAssignments
  )
  useEffect(() => {
    const timer = setInterval(() => {
      if (!activeAssignmentLoading) {
        dispatch(loadActiveShortAnswerAssignment())
      }
      setFirstLoad(false)
    }, firstLoad ? 0 : 5000);
    return () => clearTimeout(timer);
  })

  let activeAssignmentDom

  if (activeAssignment) {
    activeAssignmentDom = (
      <>
        {user &&
        <DoAssignment assignment={activeAssignment} assignmentSubmitting={assignmentSubmitting} gradedAssignments={user.gradedShortAnswerAssignments || []} />
        }
      </>
    )
  } else {
    if (activeAssignmentError) {
      activeAssignmentDom = (
        <div style={{textAlign: "center", color: "red"}}>
          {activeAssignmentError}
        </div>
      )
    } else if (firstLoad && activeAssignmentLoading) {
      activeAssignmentDom = <LoadingOutlined />
    } else {
      activeAssignmentDom = <Empty style={{marginTop: "50px"}} description={<>No in-class assignment is available at this time</>} />
    }
  }

  return (
    <>
      {activeAssignmentDom}
      <br />
      {user && user.gradedShortAnswerAssignments && <ViewGradedAssignments assignments={user.gradedShortAnswerAssignments} />}
    </>
  )
}

interface DoAssignmentProps {
  assignment: ShortAnswerAssignmentModel
  assignmentSubmitting: boolean
  gradedAssignments: GradedShortAnswerAssignmentModel[]
}
export const DoAssignment = ({ assignment, assignmentSubmitting, gradedAssignments }: DoAssignmentProps) => {
  const dispatch = useDispatch()
  const [form] = useForm()
  const [gradedQuestions, setGradedQuestions] = useState<GradedShortAnswerQuestionModel[]>([]);
  const [assignmentSubmitted, setAssignmentSubbmitted] = useState(false)

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('calling effect for questions: ', assignment.questions, ' with gradedQuestions: ', gradedQuestions)

    // Update graded questions from the latest active assignment
    let questionsChanged: boolean = false;
    for (const question of assignment.questions) {
      if (!gradedQuestions.find(gradedQuestion => gradedQuestion.id === question.id)) {
        questionsChanged = true;
        break;
      }
    }
    if (questionsChanged) {
      let newGradedQuestions: GradedShortAnswerQuestionModel[] = []
      assignment.questions.forEach(question => {
        newGradedQuestions = [...newGradedQuestions, { id: question.id, question: question.question, answer: "" }]
      })
      setGradedQuestions(newGradedQuestions)
    }

  }, [assignment.questions])

  useEffect(() => {
    for (const gradedAssignment of gradedAssignments) {
      if (gradedAssignment && gradedAssignment.id === assignment.id) {
        setAssignmentSubbmitted(true)
        return
      }
    }
    setAssignmentSubbmitted(false)
  }, [gradedAssignments])

  function onSubmitAssignment(values: any) {
    console.log('values when submitting assignment: ', values, '; gradedQuestion: ', gradedQuestions)
    dispatch(saveGradedShortAnswerAssignment(
      assignment.id,
      assignment.name,
      gradedQuestions,
      false,
      false,
      0,
      assignment.maxXp,
      "",
      "",
      false
    ))
  }

  function onChangeAnswer(questionId: string, e: React.ChangeEvent<HTMLTextAreaElement>) {
    let question = ""
    for (const gradedQuestion of gradedQuestions) {
      if (gradedQuestion.id === questionId) {
        question = gradedQuestion.question
        gradedQuestion.answer = e.target.value
        return
      }
    }
    setGradedQuestions([...gradedQuestions, { id: questionId, question, answer: e.target.value }])
  }

  return (
    <div className="active-assignment-view">
      <h1 style={{display: "flex", justifyContent: "center"}}>
        {assignment.name}
      </h1>

      <Form
        form={form}
        layout="vertical"
        name="shortAnswerAssignmentForm"
        onFinish={onSubmitAssignment}
        style={{ width: "50%" }}
      >
        {assignment.questions.map((question, i) => (
          <div key={question.id}>
            <Form.Item>
              {i + 1}. {question.question}
              <br />
              <TextArea onChange={(e) => onChangeAnswer(question.id, e)} />
            </Form.Item>
          </div>
        ))}

        {assignmentSubmitted && <Button disabled={true} htmlType="submit" type="primary">
          Submitted <CheckCircleTwoTone twoToneColor="#52c41a" />
        </Button>}

        {!assignmentSubmitted && <Button disabled={assignmentSubmitting} htmlType="submit" type="primary">
          Submit {assignmentSubmitting ? <LoadingOutlined /> : <></>}
        </Button>}
      </Form>
    </div>
  )
}

interface ViewGradedAssignmentsProps {
  assignments: GradedShortAnswerAssignmentModel[]
}
const ViewGradedAssignments = ({ assignments }: ViewGradedAssignmentsProps) => {
  return (
    <div className="graded-assignments-view">
      <h1 style={{display: "flex", justifyContent: "center"}}>
        Graded Assignments
      </h1>
      <br /><br />
      <Collapse style={{width: "100%"}}>

        {assignments.filter(assignment => assignment.graded && assignment.available).map((assignment) => (
            <Collapse.Panel header={assignment.name} key={assignment.id}>
              XP Awarded: {assignment.xpAwarded}/{assignment.maxXp}
              <br />
              {assignment.feedback && (
                <>
                  Instructor Feedback:
                  <TextArea disabled={true} value={assignment.feedback} />
                </>
              )}
              <br /><br />
              {assignment.gradedQuestions.map((question, i) => (
                <div key={question.id}>
                  {i + 1}. {question.question}
                  <br />
                  <TextArea disabled={true} value={question.answer} />
                  <br /><br />
                </div>
              ))}
            </Collapse.Panel>
        ))}
      </Collapse>
    </div>
  )
}
