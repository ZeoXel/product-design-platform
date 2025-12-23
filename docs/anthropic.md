# Messages(官方Anthropic格式)

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/messages:
    post:
      summary: Messages(官方Anthropic格式)
      deprecated: false
      description: ''
      tags:
        - 聊天(Chat)/Claude 官方格式
      parameters:
        - name: Authorization
          in: header
          description: |-
            在 Header 添加参数 Authorization，其值为在 Bearer 之后拼接 Token
            示例Authorization: Bearer 2f68dbbf-519d-4f01-9636-e2421b68f379
          required: false
          example: ''
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
              x-apifox-orders: []
            examples: {}
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
                x-apifox-orders: []
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: 聊天(Chat)/Claude 官方格式
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/3868318/apis/api-228980408-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# Messages(识图)

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/messages:
    post:
      summary: Messages(识图)
      deprecated: false
      description: ''
      tags:
        - 聊天(Chat)/Claude 官方格式
      parameters:
        - name: Authorization
          in: header
          description: |-
            在 Header 添加参数 Authorization，其值为在 Bearer 之后拼接 Token
            示例Authorization: Bearer 2f68dbbf-519d-4f01-9636-e2421b68f379
          required: false
          example: ''
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties: {}
            example: "{\r\n  \"model\": \"claude-3-5-sonnet-20240620\",\r\n  \"max_tokens\": 1024,\r\n  \"messages\": [\r\n    {\r\n      \"role\": \"user\",\r\n      \"content\": [\r\n        {\r\n          \"type\": \"image\",\r\n          \"source\": {\r\n            \"type\": \"base64\",\r\n            \"media_type\": \"image/jpeg\",\r\n            \"data\": \"/9j/4AAQSkZJRg...\" // base64 data; 仅支持 base64 传递图片\r\n          }\r\n        },\r\n        {\r\n          \"type\": \"text\",\r\n          \"text\": \"What is in this image?\"\r\n        }\r\n      ]\r\n    }\r\n  ]\r\n}"
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: 聊天(Chat)/Claude 官方格式
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/3868318/apis/api-266125082-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```