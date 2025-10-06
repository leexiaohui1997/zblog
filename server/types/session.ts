export interface AppSessionCore {
  userId: number
  email: string
}

export interface AppSessionData extends AppSessionCore {
  createdAtISO: string
}

export interface AppSessionRecord {
  sid: string
  data: AppSessionData
}
