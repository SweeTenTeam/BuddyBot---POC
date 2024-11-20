# BuddyBot

Per creare l'ambiente

```bash
docker compose up
```

Per distruggere l'ambiente

```bash
docker compose down
```

Se si vuole modificare lo schema e dati iniziali del db, modificare `db/init.sql` e fare 

```bash 
docker compose down --volumes
docker compose up --build --force-recreate
```

E' inoltre presente `adminer` per accedere direttamente al db a `localhost:8080`

Si possono cambiare le variabili d'ambiente dentro `.env`