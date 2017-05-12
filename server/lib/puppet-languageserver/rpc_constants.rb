module PuppetLanguageServer
  CODE_INVALID_JSON       = -32700
  MSG_INVALID_JSON        = "invalid JSON"

  CODE_INVALID_REQUEST    = -32600
  MSG_INVALID_REQ_JSONRPC = "invalid request: doesn't include \"jsonrpc\": \"2.0\""
  MSG_INVALID_REQ_ID      = "invalid request: wrong id"
  MSG_INVALID_REQ_METHOD  = "invalid request: wrong method"
  MSG_INVALID_REQ_PARAMS  = "invalid request: wrong params"

  CODE_METHOD_NOT_FOUND   = -32601
  MSG_METHOD_NOT_FOUND    = "method not found"

  CODE_INVALID_PARAMS     = -32602
  MSG_INVALID_PARAMS      = "invalid parameter(s)"

  CODE_INTERNAL_ERROR     = -32603
  MSG_INTERNAL_ERROR      = "internal error"

  PARSING_ERROR_RESPONSE  = "{\"jsonrpc\":\"2.0\",\"id\":null,\"error\":{" \
                            "\"code\":#{CODE_INVALID_JSON}," \
                            "\"message\":\"#{MSG_INVALID_JSON}\"}}"

  BATCH_NOT_SUPPORTED_RESPONSE  = "{\"jsonrpc\":\"2.0\",\"id\":null,\"error\":{" \
                                  "\"code\":-32099," \
                                  "\"message\":\"batch mode not implemented\"}}"

  KEY_JSONRPC   = "jsonrpc"
  VALUE_VERSION = "2.0"
  KEY_ID        = "id"
  KEY_METHOD    = "method"
  KEY_PARAMS    = "params"
  KEY_RESULT    = "result"
  KEY_ERROR     = "error"
  KEY_CODE      = "code"
  KEY_MESSAGE   = "message"
end
