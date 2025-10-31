import {createClient} from '../../utils/supabase/client'
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const getLoggedInUser = createAsyncThunk('users/getUser', async () => {
    const supabase = await createClient()
    const { data, error} = await supabase.auth.getSession()
    return data
})

export const userLogOut =  createAsyncThunk('users/logout', async () => {
    const supabase = await createClient()
    const { error} = await supabase.auth.signOut()
    console.log(error)
    return error
})

interface Error {
    error: string
}

interface User {
    session: Object;
    user: Object
}

export const userSignIn  =  createAsyncThunk('users/signIn', async (user: {email: string, password: string}) => {
    const supabase = await createClient()
    const { data, error} = await supabase.auth.signInWithPassword(user)
    return error ? { error: error.message} : data
})

export const userSlice = createSlice({
    name: 'users',
    initialState: { 
        user: {
            id: null,
        }, 
        session: {}
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getLoggedInUser.fulfilled, (state, action)=> {
            console.log('action', action)
            if(action.payload.session) {
                state.user = action.payload.session.user
                state.session = action.payload.session
            }
        })
        builder.addCase(userLogOut.fulfilled, (state, action)=> {
            state.user = { id: null }
            state.session = {}
        })
        builder.addCase(userSignIn.fulfilled, (state, action: any) => {
            console.log('payload', action)
            if(action.payload.session) {
                state.user = action.payload.session.user
                state.session = action.payload.session
            }
        })
    }
})

export default userSlice.reducer