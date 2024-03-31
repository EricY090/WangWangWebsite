import { Router } from "express";
const router = Router();
import multer from "multer";
import { ObjectId } from "mongodb";
const upload = multer({ dest: "public/media" });
import fs from "fs";
import {
  getAllPosts,
  createPost,
  deletePostById,
  getPostById
} from "../data/posts.js";
import {
  getUserById
} from "../data/users.js"
import {
  validId,
  validImageUrl,
} from "../validation.js";
import xss from 'xss';

router.route("/")
  .get(async (req, res) => {
    let auth = false;
    let allPosts;
    try {
      allPosts = await getAllPosts();
    } catch (e) {
      return res.status(500).render("error", { error: e, status: 500 });
    }
    if (req.session.user) {
      auth = true;
    }
    allPosts.forEach(element => {
      if (element.type === 'image') {
        element.isImage = true;
      } else {
        element.isImage = false
      }
    });
    //return res.json(allPosts)
    return res.render("feed", {
      title: "Feed",
      posts: allPosts,
      auth: auth,
      //id: req.session.user.id
    });
  })
  .post(upload.single("file"), async (req, res) => {
    let post = req.body;
    let fileData = req.file;
    var tagsArray = JSON.parse(post.tags);
    for (let i = 0; i < tagsArray.length; i++) {
      tagsArray[i] = tagsArray[i].trim();
    }

    if (fileData) {
      fs.readFile(fileData.path, function (err, data) {
        if (err) throw err;
        fs.writeFile(
          "public/media/" + fileData.originalname,
          data,
          function (err) {
            if (err) throw err;
          }
        );
      });
      post["media"] = "/public/media/" + fileData.originalname;
    } else {
      throw "You must upload media with your post!";
    }

    try { 
    let finalPost = await createPost(
      req.session.user.id,
      "title",
      post.media,
      tagsArray,
      post.caption
      )
      if (finalPost) {
        res.redirect("/feed");
      }
    } catch (e) {
      throw e;
  }
  });


router.route("/id/:postId").get(async (req, res) => {
 // let sessionId;
  let postId;
  try {
    postId = validId(req.params.postId);
   // sessionId = validId(req.session.user.id);
  } catch (e) {
    return res
      .status(400)
      .render("error", { error: e, status: 400 });
  }
  let thisPost;
  try {
    thisPost = await getPostById(postId);
  } catch (e) {
    return res
    .status(404)
    .render("error", { error: "Current post not found", status: 404 });
  }
  let thisUser;
  try {
    thisUser = await getUserById(thisPost.userId);
  } catch (e) {
    return res
    .status(404)
    .render("error", { error: "User for this post not found", status: 404 });
  }
  let userName = thisUser.firstName;
  let profilePic = thisUser.profilePic;
  if (thisPost.type === "image") {
    thisPost.isImage = true;
  } else {
    thisPost.isImage = false;
  }
  return res.render("post", {
      title: "post",
      post: thisPost,
      name: userName,
      profilePic:profilePic,
    });
});

export default router;