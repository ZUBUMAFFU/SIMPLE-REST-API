const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cors());

// Conexão com banco
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // PORTA IMPORTANTE!
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar no banco:', err);
    return;
  }
  console.log('Conectado ao banco!');
});

// GET - Listar todos os produtos
app.get('/produtos', (req, res) => {
  db.query('SELECT * FROM produtos', (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// POST - Adicionar novo produto
app.post('/produtos',
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('preco').isFloat({ gt: 0 }).withMessage('Preço deve ser um número positivo'),
    body('quantidade').isInt({ min: 0 }).withMessage('Quantidade deve ser um inteiro ≥ 0')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, preco, quantidade } = req.body;
    const sql = 'INSERT INTO produtos (nome, preco, quantidade) VALUES (?, ?, ?)';
    db.query(sql, [nome, preco, quantidade], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.status(201).json({ id: result.insertId, nome, preco, quantidade });
    });
  }
);

// PUT - Atualizar produto
app.put('/produtos/:id',
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('preco').isFloat({ gt: 0 }).withMessage('Preço deve ser um número positivo'),
    body('quantidade').isInt({ min: 0 }).withMessage('Quantidade deve ser um inteiro ≥ 0')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nome, preco, quantidade } = req.body;
    const sql = 'UPDATE produtos SET nome = ?, preco = ?, quantidade = ? WHERE id = ?';
    db.query(sql, [nome, preco, quantidade, id], (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0) return res.status(404).json({ message: 'Produto não encontrado' });
      res.json({ message: 'Produto atualizado com sucesso' });
    });
  }
);

// DELETE - Remover produto
app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM produtos WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Produto não encontrado' });
    res.json({ message: 'Produto deletado com sucesso' });
  });
});

// Tratamento global de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
