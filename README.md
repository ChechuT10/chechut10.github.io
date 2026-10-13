# chechut10.github.io

Mi web personal: **[chechut10.github.io](https://chechut10.github.io/)**

| Página | Qué es |
|---|---|
| [CV](https://chechut10.github.io/) | Currículum de Data Analyst y especialista en AdOps: experiencia, herramientas, formación y contacto |
| [Health Sync](https://chechut10.github.io/health-sync/) | Página de mi proyecto personal [Health Sync](https://github.com/ChechuT10/health-sync): datos de salud en una Raspberry Pi convertidos en un plan semanal |
| [Privacidad de Health Sync](https://chechut10.github.io/health-sync/privacidad.html) | Política de privacidad del proyecto (necesaria para la app OAuth de Google) |

## Estructura

```
index.html                  CV
data.json                   Contenido del CV (experiencia, herramientas, contacto…)
css/comun.css               Estilos compartidos (colores, tema claro y oscuro, tipografía)
css/inicio.css              Estilos del CV
css/health-sync.css         Estilos de la página de Health Sync
js/inicio.js                Pinta el CV a partir de data.json
js/health-sync.js           Interacción de la página de Health Sync
health-sync/index.html      Página del proyecto
health-sync/privacidad.html Política de privacidad
health-sync/css/            Estilos de la política de privacidad
```

HTML, CSS y JavaScript sin frameworks ni compilación. Tema claro y oscuro según el sistema, con botón para cambiarlo.

## Actualizar el CV

El contenido del CV está en `data.json`; el HTML no hace falta tocarlo. Las fechas van en formato `"AAAA-MM"` y `"fin": null` significa "actualidad".

## Verlo en local

`data.json` se carga con `fetch`, que no funciona abriendo el archivo con doble clic. Hace falta un servidor local:

```bash
python3 -m http.server 8000
```

y abrir [localhost:8000](http://localhost:8000).

## Publicación

GitHub Pages publica la rama `main` automáticamente. Los cambios se preparan en una rama aparte, se revisan y se unen a `main` con un pull request.

---

Hecho por **Jesús Tirado González** · [LinkedIn](https://www.linkedin.com/in/jesustiradogonzalez)
