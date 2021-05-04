import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';


export const getServer = () => {
  const app = express();

  app.use(morgan('combined'));
  app.use(bodyParser.json())

  app.get('/brotli', (req, res) => {
    res.send({
      result: 1,
    });
  });

  app.get('/brotli/42', (req, res) => {
    res.send({
      result: 42,
    });
  });


  app.get('/brotli/77', (req, res) => {
    res.send({
      result: '77',
    });
  });

  app.get('/brotli/404', (req, res) => {
    res.sendStatus(404);
  });

  app.get('/array', (req, res) => {
    res.send((req.query.ids as any[]).map(Number));
  });

  app.post('/body', (req, res) => {
    res.send(req.body);
  });

  app.get('/omit-query', (req, res) => {
    res.send({
      result: Number(req.query.a),
    });
  })

  app.get('/omit-path/:id', (req, res) => {
    res.send({
      result: Number(req.params.id),
    });
  })

  app.post('/omit-body', (req, res) => {
    res.send({
      result: Number(req.body.a),
    });
  })


  let server: any;

  return new Promise<void>(r => {
    server = app.listen(3123, () => r(server));
  });
}


