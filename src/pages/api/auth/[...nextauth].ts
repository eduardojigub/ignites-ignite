import NextAuth from 'next-auth'
import GitHubProvider from "next-auth/providers/github";

import {query as q} from 'faunadb'
import { fauna } from '../../../services/fauna'
import { signIn } from 'next-auth/react';

export default NextAuth({
    // Configure one or more authentication providers
    providers: [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        authorization: {
          params: {
            scope: 'read:user',
          },
        },
      }),
    ],
      callbacks: {
        async signIn({ user }) {
          const { email } = user

          try {
            await fauna.query(
              q.If(
                q.Not(
                  q.Exists(
                    q.Match(
                      q.Index('user_by_email'),
                      q.Casefold(user.email)
                    )
                  )
                ),
                q.Create(
                  q.Collection('users'),
                  { data: { email } }
              ),
              q.Get(
                q.Match(
                  q.Index('user_by_email'),
                  q.Casefold(user.email)
                  )
                )
              )
            )
            return true
          }
          catch {
            return false
          }
        },
      }
})