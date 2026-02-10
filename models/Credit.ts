// Credit model interface for user credits system
export interface ICredit {
  id?: string
  user_email: string
  credits: number
  created_at?: Date
  updated_at?: Date
}

// Initial credit amount for new users
export const INITIAL_CREDITS = 180

// Credit costs for different features
export const CREDIT_COSTS = {
  VIDEO_INFO: 10,
  CHANNEL_INFO: 10,
  COMPARE: 10,
  TITLE_GENERATOR: 5,
  DESCRIPTION_GENERATOR: 5,
  TAG_GENERATOR: 5,
  TAG_RECOMMENDATION: 30,
  FIND_TAG: 10,
  AI_TOOLS: 15,
}

export default ICredit
