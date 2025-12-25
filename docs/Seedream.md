# 即梦4 绘图

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/images/generations:
    post:
      summary: 即梦4 绘图
      deprecated: false
      description: 支持多图参考
      tags:
        - 绘图模型/ 豆包(即梦、火山)绘图/即梦4
      parameters:
        - name: Authorization
          in: header
          description: ''
          required: false
          example: Bearer {{YOUR_API_KEY}}
          schema:
            type: string
            default: Bearer {{YOUR_API_KEY}}
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                model:
                  type: string
                  x-apifox-mock: doubao-seedream-4-5-251128
                prompt:
                  type: string
                image:
                  type: array
                  items:
                    type: string
                  description: 不带就是文生图
                sequential_image_generation:
                  type: string
                response_format:
                  type: string
                size:
                  type: string
                stream:
                  type: boolean
                watermark:
                  type: boolean
                'n':
                  type: string
                  description: 组图
                  x-apifox-mock: '3'
              required:
                - model
                - prompt
              x-apifox-orders:
                - model
                - prompt
                - image
                - 'n'
                - sequential_image_generation
                - response_format
                - size
                - stream
                - watermark
            example:
              model: doubao-seedream-4-5-251128
              prompt: 生成3张女孩和奶牛玩偶在游乐园开心地坐过山车的图片，涵盖早晨、中午、晚上
              image:
                - >-
                  https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_1.png
                - >-
                  https://ark-project.tos-cn-beijing.volces.com/doc_image/seedream4_imagesToimages_2.png
              sequential_image_generation: auto
              'n': 3
              response_format: url
              size: 2K
              stream: true
              watermark: true
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      type: object
                      properties:
                        url:
                          type: string
                      x-apifox-orders:
                        - url
                  created:
                    type: integer
                  usage:
                    type: object
                    properties:
                      prompt_tokens:
                        type: integer
                      completion_tokens:
                        type: integer
                      total_tokens:
                        type: integer
                      prompt_tokens_details:
                        type: object
                        properties:
                          cached_tokens_details:
                            type: object
                            properties: {}
                            x-apifox-orders: []
                        required:
                          - cached_tokens_details
                        x-apifox-orders:
                          - cached_tokens_details
                      completion_tokens_details:
                        type: object
                        properties: {}
                        x-apifox-orders: []
                      output_tokens:
                        type: integer
                    required:
                      - prompt_tokens
                      - completion_tokens
                      - total_tokens
                      - prompt_tokens_details
                      - completion_tokens_details
                      - output_tokens
                    x-apifox-orders:
                      - prompt_tokens
                      - completion_tokens
                      - total_tokens
                      - prompt_tokens_details
                      - completion_tokens_details
                      - output_tokens
                required:
                  - data
                  - created
                  - usage
                x-apifox-orders:
                  - data
                  - created
                  - usage
              example:
                data:
                  - url: "https://example.com/generated-image-0.jpeg?signed=xxx"
                  - url: "https://example.com/generated-image-1.jpeg?signed=xxx"
                  - url: "https://example.com/generated-image-2.jpeg?signed=xxx"
                created: 1758200023
                usage:
                  prompt_tokens: 0
                  completion_tokens: 0
                  total_tokens: 53400
                  prompt_tokens_details:
                    cached_tokens_details: {}
                  completion_tokens_details: {}
                  output_tokens: 53400
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: 绘图模型/ 豆包(即梦、火山)绘图/即梦4
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/3868318/apis/api-347833949-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```

# 即梦4 edits

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /v1/images/edits:
    post:
      summary: 即梦4 edits
      deprecated: false
      description: ''
      tags:
        - 绘图模型/ 豆包(即梦、火山)绘图/即梦4
      parameters:
        - name: Authorization
          in: header
          description: ''
          required: false
          example: Bearer {{YOUR_API_KEY}}
          schema:
            type: string
            default: Bearer {{YOUR_API_KEY}}
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                model:
                  example: doubao-seedream-4-5-251128
                  type: string
                image:
                  format: binary
                  type: string
                  example: >-
                    cmMtdXBsb2FkLTE2ODc4MzMzNDc3NTEtMjA=/31225951_59371037e9_small.png
                mask:
                  example: ''
                  type: string
                prompt:
                  example: A cute baby sea otter wearing a beret.
                  type: string
                'n':
                  example: '1'
                  type: string
                size:
                  example: 1024x1024
                  type: string
                response_format:
                  example: url
                  type: string
              required:
                - model
                - image
                - prompt
            examples: {}
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties: {}
              example:
                data:
                  - url: "https://example.com/generated-image-0.jpeg?signed=xxx"
                  - url: "https://example.com/generated-image-1.jpeg?signed=xxx"
                  - url: "https://example.com/generated-image-2.jpeg?signed=xxx"
                created: 1758200023
                usage:
                  prompt_tokens: 0
                  completion_tokens: 0
                  total_tokens: 53400
                  prompt_tokens_details:
                    cached_tokens_details: {}
                  completion_tokens_details: {}
                  output_tokens: 53400
          headers: {}
          x-apifox-name: 成功
      security: []
      x-apifox-folder: 绘图模型/ 豆包(即梦、火山)绘图/即梦4
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/3868318/apis/api-349233981-run
components:
  schemas: {}
  securitySchemes: {}
servers: []
security: []

```