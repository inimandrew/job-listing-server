import * as jwt from "jsonwebtoken"
const tokenSecret = "feUUa56SEuHgZDS0oX832nIIn95ljqXs"

export const middleware = {
  verify(req: any, res: any, next: any) {
    const token = req.headers.authorization
    if (!token) {
      res.status(401).json({ errors: { status: ["Unauthorised. Token Required."] } })
    }
    else {
      jwt.verify(token, tokenSecret, (err: any, value: any) => {
        if (err) {
          res.status(401).json({ errors: { status: ['Unauthorised. Token Invalid'] } })
        } else {
          req.user = value.data
          next()
        }
      })
    }
  }
}
export default middleware
