#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ─────────────────────────────────────────
// Configuración WiFi
// ─────────────────────────────────────────
const char* WIFI_SSID     = "SpaceX";       // cambia esto
const char* WIFI_PASSWORD = "Isic2026??$";  // cambia esto

// ─────────────────────────────────────────
// Configuración MQTT
// IP de la máquina donde corre Docker
// ─────────────────────────────────────────
const char* MQTT_BROKER = "192.168.2.80";  // cambia esto por la IP de tu máquina
const int   MQTT_PORT   = 1883;
const char* MQTT_TOPIC  = "alerts/panic/ESP32-001";

// ─────────────────────────────────────────
// Identidad y coordenadas del dispositivo
// ─────────────────────────────────────────
const char*  DEVICE_ID = "ESP32-001";
const float  LAT       = 19.958048959579603;
const float  LON       = -99.53317718313082;

// ─────────────────────────────────────────
// Pin del botón de pánico
// ─────────────────────────────────────────
const int BUTTON_PIN = 15;

// ─────────────────────────────────────────
// Variables de control
// ─────────────────────────────────────────
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

bool  lastButtonState = HIGH;  // pullup interno: HIGH = no presionado
unsigned long lastPublishTime = 0;
const unsigned long DEBOUNCE_MS = 300;  // evita múltiples envíos por un solo press

// Prototipos de funciones
void connectWiFi();
void connectMQTT();
void publishAlert();

// ─────────────────────────────────────────
// Setup
// ─────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  connectWiFi();

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setKeepAlive(60);
  mqttClient.setSocketTimeout(30);
  connectMQTT();
}

// ─────────────────────────────────────────
// Loop principal
// ─────────────────────────────────────────
void loop() {
  // Mantener conexión MQTT activa
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Leer botón
  bool currentState = digitalRead(BUTTON_PIN);

  // Detectar flanco de bajada (HIGH → LOW = botón presionado)
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
  doc["timestamp"]      = millis() / 1000;  // segundos desde boot
  doc["emergency_type"] = "Incendio";
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
