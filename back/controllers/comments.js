const mysql = require('mysql')

// model
const Comment = require('../models/Comment')

// mysql db
const dbConfig = require('../db_config')
const db = mysql.createPool(dbConfig.params)

exports.getAllComments = (req, res, next) => {
  if(req.body[0]) {
    db.query(
      `
      SELECT  c.created_at,
              c.text,
              c.forum_id,
              a.firstname,
              a.lastname,
              a.pic_url
      FROM Comments as c
      INNER JOIN Accounts as a
      ON a.id = c.user_id
      WHERE
      forum_id in (${req.body[0]})
      ORDER BY c.created_at DESC
      `
      , (err, result) => {
      // error handler
      if(err) {
        return res.status(400).json({ sub_err: "La récupération des commentaires a échouée, veuillez réessayer dans quelques instants..", err })
      }
      
      // if user doesn't have custom icon, replace by vanilla icon
      result.forEach(userComment => {
        if(!userComment.pic_url) {
            userComment.pic_url = "http://localhost:3000/images/user-icon.png"
        }
      });
      
      return res.status(200).json({ result })
    })
  }
  // fields missing
  else{
    return res.status(400).json({ sub_err: "Validation de donnée: Il semblerait que l'un des champs requis est manquant." })
  }
}

exports.createOneComment = (req, res, next) => {
    let user_id = req.body[1].id
    let forum_id = req.body[0].forum_id
    let comment_text = req.body[0].text
    
    // required fields
    if(user_id && forum_id && comment_text) {
        let dataValidation
        dataValidation = Comment.validate({user_id:user_id, forum_id:forum_id, text:comment_text})
        
        // data validation failed
        if(dataValidation.error) {
          let dataValidationError = {
            message: dataValidation.error.details[0].message,
            code: dataValidation.error.details[0].type
          }
          return res.status(400).json({ sub_err: "Validation de donnée: Il semblerait que l'un des champs requis est incorrect.", err: dataValidationError })
        }
        // data validation success
        else {
            // insert in db the new comment
            db.query(`INSERT INTO Comments (user_id, forum_id, text) VALUES (${user_id}, ${forum_id}, "${comment_text}")`, (err, result) => {
                // error handler
                if(err) {
                    return res.status(400).json({ sub_err: "La création du commentaire a échoué, veuillez réessayer dans quelques instants..", err })
                }
                // forum created
                return res.status(200).json({
                  message: `Le commentaire a été créé avec succès !`,
                })
            })
        }
    }
    // fields missing
    else{
        return res.status(400).json({ sub_err: "Validation de donnée: Il semblerait que l'un des champs requis est manquant." })
    }
}