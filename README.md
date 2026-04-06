# ⚡ Deep Work CLI (`dw`)

> Terminal'den çıkmadan odaklan. Görevlerini yönet. Zamanını geri kazan.

`dw`, fare kullanmayı sevmeyen geliştiriciler için tasarlanmış, **terminal tabanlı bir görev yöneticisi ve Pomodoro zamanlayıcısıdır.** Hafif, hızlı ve tamamen yerel çalışır — internet bağlantısı, bulut senkronizasyonu veya abonelik gerektirmez.

```
$ dw stat

  ═══ DeepWork İstatistikleri ═══

  📅 Bugünün Özeti
  ─────────────────────────────
  ⏱  Toplam odaklanma  : 2 saat 25 dakika
  ✔  Biten görev       : 3
  🍅 Tamamlanan seans  : 5
  ⚡ Kesilen seans     : 1

  📊 Son 30 Günlük Odaklanma Haritası
  ─────────────────────────────

  ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
  ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
  ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
```

---

## Neden `dw`?

Çoğu görev yöneticisi ya çok karmaşık ya da fazla basittir. `dw` tam ortasını bulur:

- **Bağımlılık yok.** Veriler `~/.deepwork/data.db` içinde, SQLite ile yerel olarak saklanır.
- **Hız.** Her komut milisaniyeler içinde çalışır.
- **Odak.** Pomodoro sayacı terminalden hiç çıkmandan çalışır.
- **Görünürlük.** GitHub tarzı katkı grafiğiyle odaklanma geçmişine tek bakışta hakim ol.

---

## Özellikler

- **Görev Yönetimi** — Görev ekle, sil, düzenle, tamamla
- **Proje Organizasyonu** — Görevleri projelere grupla
- **Etiket Sistemi** — Çoklu etiket desteği ve AND mantıklı filtreleme
- **Enerji Seviyeleri** — `low / medium / high` ile görevleri önceliklendir
- **Pomodoro Zamanlayıcı** — Canlı geri sayım, `Ctrl+C` kesintisi kaydı ve masaüstü bildirimi
- **İnteraktif Formlar** — `dw edit` ile eski verileri gören, form tabanlı düzenleme
- **İstatistik Paneli** — Günlük özet ve son 30 günün odaklanma ısı haritası
- **SQLite Tabanlı** — Tamamen yerel, hızlı, kurulum gerektirmez

---

## Kurulum

```bash
npm install -g deepwork-cli
```

İlk kurulumdan sonra veritabanını başlat:

```bash
dw init
```

---

## Kullanım

### Veritabanı Kurulumu

```bash
dw init
# ✔ Kurulum Başarılı!
#   Veritabanı: /Users/siz/.deepwork/data.db
```

### Görev Ekleme

```bash
# Basit görev
dw add "README dosyasını yaz"

# Tüm seçeneklerle
dw add "Header component'ini bitir" \
  --energy high \
  --project "frontend" \
  --tag feature \
  --tag ui
```

### Görevleri Listeleme

```bash
# Tüm aktif görevler
dw list

# Etiket filtresiyle (AND mantığı — her iki etikete sahip olanlar)
dw list --tag feature --tag ui
```

```
┌──────┬──────────────────────────────┬──────────────┬──────────┬──────────────┬────────────────┐
│ #    │ Başlık                       │ Durum        │ Enerji   │ Proje        │ Etiketler      │
├──────┼──────────────────────────────┼──────────────┼──────────┼──────────────┼────────────────┤
│ 1    │ Header component'ini bitir   │ TODO         │ high     │ frontend     │ feature, ui    │
└──────┴──────────────────────────────┴──────────────┴──────────┴──────────────┴────────────────┘
```

### Pomodoro Başlatma

```bash
dw start 1
# 🍅 Pomodoro başlatıldı! [#1] Header component'ini bitir
#    Süre: 25 dakika  |  Ctrl+C ile durdurabilirsin
#    ⏱ 24:35 kaldı
```

Süre bitince masaüstü bildirimi alırsın. `Ctrl+C` ile kesilirse kesinti olarak kaydedilir.

### Görevi Tamamlama

```bash
dw done 1
# 🎉 Tebrikler! Görev tamamlandı.
#    "Header component'ini bitir"
#
#    Toplam odaklanma süresi: 1 saat 15 dakika
```

### Görev Silme

```bash
# Onay sorar
dw rm 1

# Onay sormadan sil
dw rm 1 --force
```

### Görev Düzenleme (İnteraktif)

```bash
dw edit 1
# ✎ Görev Düzenleniyor [#1]
# ? Başlık: Header component'ini bitir
# ? Enerji Seviyesi: high
# ? Durum: IN_PROGRESS
```

### Etiket Ekleme

```bash
dw tag 1 "refactor"
# ✔ Etiket eklendi: [#1] refactor
```

### Ayar Değiştirme

```bash
# Pomodoro süresini 50 dakikaya ayarla
dw config set pomodoro_duration 50

# Mevcut değeri gör
dw config get pomodoro_duration
```

### İstatistikler

```bash
dw stat
```

Günlük odaklanma özeti ve son 30 günün renk kodlu ısı haritasını gösterir.

---

## Tüm Komutlar

| Komut | Açıklama |
|---|---|
| `dw init` | Veritabanını kur |
| `dw add <başlık>` | Yeni görev ekle |
| `dw list` | Aktif görevleri listele |
| `dw start <id>` | Pomodoro başlat |
| `dw done <id>` | Görevi tamamla |
| `dw rm <id>` | Görevi sil |
| `dw edit <id>` | Görevi interaktif düzenle |
| `dw tag <id> <etiket>` | Etiket ekle |
| `dw config set <key> <value>` | Ayar değiştir |
| `dw config get <key>` | Ayar oku |
| `dw stat` | İstatistik ve odaklanma haritası |

---

## Veritabanı

Tüm veriler `~/.deepwork/data.db` dosyasında yerel olarak saklanır. Başka bir cihaza taşımak için bu dosyayı kopyalamak yeterlidir.

---

## Katkıda Bulunma

Pull request'ler açıktır. Büyük değişiklikler için lütfen önce bir issue açın.

```bash
git clone https://github.com/kullanici-adi/deepwork-cli.git
cd deepwork-cli
npm install
npm run build
node dist/bin/dw.js --help
```

---

## Lisans

[MIT](LICENSE) © Adın Soyadın
