# 服务器部署

这是一个不需要构建步骤的静态网站。服务器应把整个仓库作为网站根目录，以确保主视觉图片和视频路径可用。

## 拉取代码

```bash
git clone https://github.com/jeanxue7/jean-ongoing-voyage.git
cd jean-ongoing-voyage
```

仓库目前是私有仓库。服务器需要使用有访问权限的 GitHub 账号、Personal Access Token 或 Deploy Key 拉取。

## Nginx 示例

```nginx
server {
    listen 80;
    server_name your-domain.example;

    root /var/www/jean-ongoing-voyage;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

配置完成后检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

访问域名首页会自动进入：

```text
/prototype/journey-interactions-v1/#scene-opening
```

## 后续更新

本地修改并推送到 GitHub 后，在服务器仓库目录执行：

```bash
git pull origin main
```

