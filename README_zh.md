# 珠海房产

珠海房产脉搏：通过数据分析和可视化揭示历史成交价格
撰写人：Kirin

## 直接访问我们已经部署好的站点

我放在自己的云服务器上了。

[这里](https://zhproperty.bakaawt.com/)（https://zhproperty.bakaawt.com/）

## 命名规范

- `Zhuhai Property`：项目名称
- `zhuhai-property`：仓库名称、工作区，以及根文件夹
- `zhproperty`：SQL数据库及用户的名称
- `property`: SQL表的名称

## 目录结构

- `design`: 项目的设计原型，包含软件设计规范，项目报告，数据库设计原型，ER图等文件。
- `src`: 项目源代码库，包括前后端、数据库等一切使用到了的代码文件。
  - `frontend`: 前端源代码库
    - `build`: 包含已经编译的静态网页文件
    - `config`: 用于设置页面的部分样式规范
    - `node_modules`: 所有的包文件
    - `public`: 静态网页生成范式
    - `scripts`: 用于调试用
    - `src`: React 代码库，包含所有页面的源文件
      - `assets`: 一些非 JSX 文件
      - `common`: 布局等文件
      - `hooks`: React Router 相关
      - `models`: JSX 页面前置
      - `pages`: **核心**，所有前端页面
      - `router`: 用于页面间的索引和导航
  - `backend`: 后端源代码库
    - `api`: 后端核心代码
  - `database`: 数据库相关代码
- `LICENSE`: 开源协议文件
- `README.md`: 项目自述文件 Markdown 版本（英文）
- `README_zh.md`: 项目自述文件 Markdown 版本（中文）

## 前端文件使用指南

使用 React 制作，需要配置包管理器运行。

### 直接运行编译好的文件（以 XAMPP 为例）使用我们部署好的后端站点

把根目录下 `build` 文件夹里的内容丢进 xampp 的网站目录里，浏览器访问。

### 在开发环境下运行

如何安装 NodeJS: https://nodejs.dev/en/learn/how-to-install-nodejs/

#### 修改后端 API 地址

在 `src/frontend/src/assets/js/config.js` 中有这么一行：

```javascript
const siteName = 'Zhuhai Property';
const siteUrl = 'https://zhproperty.bakaawt.com';
const siteDescription = 'Zhuhai Property';
const apiBaseUrl = 'https://zhproperty-api.up.railway.app';
// const apiBaseUrl = 'http://localhost:8000';

export { siteName, siteUrl, siteDescription, apiBaseUrl };
```

注释掉第四行，反注释第五行，像这样：

```javascript
const siteName = 'Zhuhai Property';
const siteUrl = 'https://zhproperty.bakaawt.com';
const siteDescription = 'Zhuhai Property';
// const apiBaseUrl = 'https://zhproperty-api.up.railway.app';
const apiBaseUrl = 'http://localhost:8000';

export { siteName, siteUrl, siteDescription, apiBaseUrl };
```

即成功修改了前端请求的 API 服务器的地址。

#### 安装依赖包并直接运行

```shell
cd frontend
yarn install
yarn start
```

或者

```shell
cd frontend
npm install
npm start
```

然后访问 [这里](http://localhost:3000/) 就可以了。（http://localhost:3000/）

#### 编译静态文件

```shell
cd src/frontend
yarn install
yarn build
```

### 布局

侧边布局：主导航放置于页面的左侧固定位置，辅助菜单放置于工作区顶部。适用于同时存在多级导航菜单，菜单多层嵌套的系统。

上下布局：主导航放置于页面的顶端。由于导航栏水平空间有限，适用于那些一级导航项没有很多的信息结构的系统。

顶-侧布局：同样拥有顶部导航及侧边栏，适用于应用型的网站，但是会牺牲部分内容空间。

## 后端文件使用指南

使用 Python 编写，但需要提前安装一些包。

#### 安装依赖包并运行

```shell
cd src/backend
pip3 install -r requirements.txt
python3 run.py
```
