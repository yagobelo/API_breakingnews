import News from "../models/News.js";

import {
  newsUpdateService,
  deleteNewsService,
  likeNewsService,
  deleteLikeNewsService,
} from "../services/newsService.js";

export const createNews = async (req, res) => {
  try {
    const { title, description, banner } = req.body;
    const newNews = {
      title,
      description,
      banner,
      user: req.userId,
    };
    await News.create(newNews);
    const newsCreated = {
      Titulo: newNews.title,
      Descrição: newNews.description,
    };

    res.status(201).json("Nova notícia criada!");
  } catch (error) {
    res.status(401).json({ message: "Erro interno ao criar nova notícia!" });
    console.log(error);
  }
};

export const findAllNews = async (req, res) => {
  try {
    let { limit, offset } = req.query;
    limit = Number(limit);
    offset = Number(offset);

    if (!limit) {
      limit = 5;
    }
    if (!offset) {
      offset = 0;
    }

    const news = await News.find()
      .sort({ _id: -1 })
      .skip(offset)
      .limit(limit)
      .populate("user");

    const totalCountNews = await News.countDocuments();
    const currentyUrl = req.baseUrl;

    const next = offset + limit;
    const nextUrl =
      next < totalCountNews
        ? `${currentyUrl}?limit=${limit}&offset=${next}`
        : null;

    const previous = offset - limit < 0 ? null : offset - limit;
    const previousUrl =
      previous != null
        ? `${currentyUrl}?limit=${limit}&offset=${previous}`
        : null;

    if (!news) {
      return res.status(400).json({ message: "Nenhuma noticia encontrada!" });
    }
    res.status(200).send({
      nextUrl,
      previousUrl,
      limit,
      offset,
      totalCountNews,
      results: news.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        banner: item.banner,
        likes: item.likes,
        comments: item.comments,
        userName: item.user.userName,
      })),
    });
  } catch (error) {
    res
      .status(401)
      .json({ message: "Erro interno ao buscar todas as notícias!" });
    console.log(error);
  }
};

export const topNews = async (req, res) => {
  try {
    const news = await News.findOne().sort({ _id: -1 }).populate("user");

    if (!news) {
      res
        .status(400)
        .json({ message: "Não foi possivel encontrar a notícia!" });
    }

    res.status(200).send({
      news: {
        id: news._id,
        title: news.title,
        description: news.description,
        banner: news.banner,
        likes: news.likes,
        comments: news.comments,
        userName: news.user.userName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro interno ao buscar notícia!" });
    console.log(error);
  }
};

export const findNewsById = async (req, res) => {
  try {
    const news = await News.findOne({ _id: req.params.id }).populate("user");
    if (!news) {
      return res.status(400).send({ message: "Noticia não encontrada!" });
    }
    res.status(200).json({
      news: {
        id: news._id,
        title: news.title,
        description: news.description,
        banner: news.banner,
        likes: news.likes,
        comments: news.comments,
        userName: news.user.userName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Erro interno ao buscar notícia!" });
    console.log(error);
  }
};

export const findNewsByTitle = async (req, res) => {
  try {
    const { title } = req.query;
    const news = await News.find({
      title: { $regex: `${title || ""}`, $options: "i" },
    })
      .sort({ _id: -1 })
      .populate("user");

    if (!news) {
      res
        .status(400)
        .json({ message: "Não existe nenhuma notícia com esse titulo!" });
    }

    res.status(200).send({
      results: news.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        banner: item.banner,
        likes: item.likes,
        comments: item.comments,
        userName: item.user.userName,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Erro interno ao buscar notícia!" });
    console.log(error);
  }
};

export const findNewsByUser = async (req, res) => {
  try {
    const id = req.userId;
    const news = await News.find({ user: id })
      .sort({ _id: -1 })
      .populate("user");

    res.status(200).send({
      results: news.map((item) => ({
        id: item._id,
        title: item.title,
        description: item.description,
        banner: item.banner,
        likes: item.likes,
        comments: item.comments,
        userName: item.user.userName,
      })),
    });
  } catch (error) {
    res.status(500).send({ message: "Erro interno ao buscar notícia!" });
    console.log(error);
  }
};

export const updateNews = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, banner } = req.body;

    if (!title && !description && !banner) {
      return res.status(400).send({ message: "Digite algo para atualizar!" });
    }

    const news = await News.findOne({ _id: id }).populate("user");

    if (news.user._id != req.userId) {
      return res
        .status(400)
        .send({ message: "Você não pode fazer atualização nessa noticia!" });
    }

    await newsUpdateService(id, title, description, banner);
    return res.status(200).send({ message: "Noticia atualizada com sucesso!" });
  } catch (error) {
    res.status(500).send({ message: "Erro interno ao atualizar notícia!" });
    console.log(error);
  }
};

export const deleteNews = async (req, res) => {
  try {
    const id = req.params.id;

    const news = await News.findOne({ _id: id }).populate("user");

    if (!news) {
      return res.status(400).send({ message: "Noticia não encontrada!" });
    }

    if (news.user._id != req.userId) {
      return res
        .status(400)
        .send({ message: "Você não pode fazer deleção nessa noticia!" });
    }

    await deleteNewsService(id);
    return res.status(200).send({ message: "Noticia deletada com sucesso!" });
  } catch (error) {
    res.status(500).send({ message: "Erro interno ao deletar notícia!" });
    console.log(error);
  }
};

export const likeNews = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.userId;

    const newsLiked = await likeNewsService(id, userId);

    if (!newsLiked) {
      await deleteLikeNewsService(id, userId);
      return res.status(200).send({ message: "Like removido com sucesso!" });
    }

    res.send({ message: "Like inserido!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
    console.log(error);
  }
};
