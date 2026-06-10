#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ─────────────────────────────────────────
// Configuración WiFi
// ─────────────────────────────────────────
const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_PASSWORD_WIFI";

// ─────────────────────────────────────────
// Configuración MQTT
// ─────────────────────────────────────────
const char* MQTT_BROKER = "192.168.1.100";  // cambia esto por la IP de tu máquina
const int   MQTT_PORT   = 1883;
const char* MQTT_TOPIC  = "alerts/panic/ESP32-002";

// ─────────────────────────────────────────
// Identidad y coordenadas del dispositivo
// Coordenadas distintas a ESP32-001
// ─────────────────────────────────────────
const char*  DEVICE_ID = "ESP32-002";
const float  LAT       = 20.0489;
const float  LON       = -99.3401;

// ─────────────────────────────────────────
// Pin del botón de pánico
// ─────────────────────────────────────────
const int BUTTON_PIN = 15;

// ─────────────────────────────────────────
// Variables de control
// ─────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

bool lastButtonState = HIGH;
unsigned long lastPublishTime = 0;
const unsigned long DEBOUNCE_MS = 300;

// ─────────────────────────────────────────
// Setup
// ─────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  connectWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setKeepAlive(60);
  connectMQTT();
}

// ─────────────────────────────────────────
// Loop principal
// ─────────────────────────────────────────
void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  bool currentState = digitalRead(BUTTON_PIN);

  if (currentState == LOW && lastButtonState == HIGH) {
    unsigned long now = millis();
    if (now - lastPublishTime > DEBOUNCE_MS) {
      publishAlert();
      lastPublishTime = now;
    }
  }

  lastButtonState = currentState;
  delay(50);
}

// ─────────────────────────────────────────
// Publicar alerta al broker MQTT
// ─────────────────────────────────────────
void publishAlert() {
  StaticJsonDocument<256> doc;

  doc["device_id"]      = DEVICE_ID;
  doc["lat"]            = LAT;
  doc["lon"]            = LON;
  doc["timestamp"]      = millis() / 1000;
  doc["emergency_type"] = "panico";
  doc["description"]    = "boton de panico activado";

  char payload[256];
  serializeJson(doc, payload);

  bool ok = mqttClient.publish(MQTT_TOPIC, payload, false);

  if (ok) {
    Serial.println("✓ Alerta publicada:");
    Serial.println(payload);
  } else {
    Serial.println("✗ Error al publicar — verificar conexión MQTT");
  }
}

// ─────────────────────────────────────────
// Conexión WiFi
// ─────────────────────────────────────────
void connectWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi conectado — IP: ");
  Serial.println(WiFi.localIP());
}

// ─────────────────────────────────────────
// Conexión MQTT con reintentos
// ─────────────────────────────────────────
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Conectando a MQTT broker...");

    String clientId = String(DEVICE_ID) + "-" + String(millis());

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" conectado");
    } else {
      Serial.print(" falló, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" — reintentando en 3s");
      delay(3000);
    }
  }
}
