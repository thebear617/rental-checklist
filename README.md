# 租房对账表

三阶段检查清单：联系中介并首次看房 → 二次看房 → 三次看房并签合同。

## 当前部署

仓库：https://github.com/thebear617/rental-checklist

在线地址：https://thebear617.github.io/rental-checklist/

本地维护：`/Users/mokaiche/Documents/house`

## 项目结构

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── checklist-data.js    # 三阶段结构化问题数据
│   └── app.js               # Tab 切换、搜索与渲染逻辑
├── 租房对账表-V1.HTML        # 原始版本（保留）
└── README.md
```

## 数据格式

`js/checklist-data.js` 定义 `phases` 数组，每阶段包含多个 `sections`，每个 section 包含若干问题：

```js
{
  id: 'screening',
  title: '第一阶段',
  label: '联系中介并首次看房',
  subtitle: '…',
  sections: [
    {
      title: '通勤与交通',
      items: [
        { q: '问题文本', hint: '为什么要问 / 要注意什么' }
      ]
    }
  ]
}
```

三个阶段：
- **第一阶段 · 联系中介并首次看房**（16 项）：线上问清楚 + 首次实地看房，排除有硬伤的房源
- **第二阶段 · 二次看房**（67 项）：带着首次发现的问题重点复查，逐项拍照留底
- **第三阶段 · 三次看房并签合同**（10 项）：最终检查 + 签合同前逐条对账，保障押金能全退

## 功能

- **三 Tab 切换**：按时间线分阶段，逐步推进
- **搜索**：每个阶段独立的搜索框，200ms 防抖
- **统计面板**：实时显示本阶段检查项/区域/匹配数
- **响应式**：适配桌面和移动端

## 事实源头

原始表单：`/Users/mokaiche/Documents/house/租房对账表-V1.HTML`

V2 已重构为结构化三阶段数据。后续修改直接编辑 `js/checklist-data.js`。

## 更新流程

1. 编辑 `js/checklist-data.js` 中的问题内容
2. 本地打开 `index.html` 检查页面是否正常
3. 提交并推送：

```bash
git add . && git commit -m "update: xxx" && git push origin main
```

网站通过 GitHub Pages 部署，push 后自动生效。
