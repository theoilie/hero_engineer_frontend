import React, { useState } from "react"
import { useDispatch } from "react-redux"

import { Button, Input} from "antd"

import { UserWhitelistModel } from "../../../api/userAPI"
import { addUserToWhitelist, removeUserFromWhitelist } from "../../../features/userSlice"

interface AdminUserWhitelistProps {
  whitelist: UserWhitelistModel
}
export const AdminUserWhitelist = ({ whitelist }: AdminUserWhitelistProps) => {
  const dispatch = useDispatch()
  const [email, setEmail] = useState("")

  function onChangeEmail(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
  }

  function removeEmail(email: string) {
    dispatch(removeUserFromWhitelist(email))
  }

  function addEmail() {
    dispatch(addUserToWhitelist(email))
  }

  return (
    <div style={{width: "100%"}}>
      {whitelist.emails.map((email, i) => (
        <div key={i} style={{textAlign: "left"}}>
          {email}
          <Button onClick={() => {removeEmail(email)}}>Remove</Button>
        </div>
      ))}

      <br />
      <div style={{display: "flex", flexDirection: "row", width: "25%"}}>
        <Input placeholder="ttrojan@usc.edu" onChange={onChangeEmail} />
        <Button onClick={addEmail}>Add</Button>
      </div>
    </div>
  )
}
