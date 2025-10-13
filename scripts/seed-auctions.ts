import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

async function seedAuctions(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it to .env or your environment and rerun.')
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  const sql = `
    INSERT INTO auctions
      (display_id, title, description, image_url, retail_price, current_price, bid_increment, status, start_time, timer_seconds, is_bid_package)
    VALUES
      ('QB/1001', 'Apple iPhone 15 Pro 128GB', 'Flagship smartphone with A17 Pro chip.', 'https://example.com/iphone15.jpg', 1199.00, 0.00, 0.01, 'upcoming', NOW() + INTERVAL '5 minutes', 10, FALSE),
      ('QB/1002', 'Samsung Galaxy S24 Ultra', 'Premium Android phone with advanced camera.', 'https://example.com/galaxy-s24-ultra.jpg', 1299.00, 0.00, 0.01, 'upcoming', NOW() + INTERVAL '10 minutes', 10, FALSE),
      ('QB/1003', 'Sony WH-1000XM5 Headphones', 'Noise-cancelling over-ear headphones.', 'https://example.com/sony-xm5.jpg', 399.00, 0.00, 0.01, 'upcoming', NOW() + INTERVAL '15 minutes', 10, FALSE),
      ('QB/1004', 'Apple Watch Series 9', 'Advanced health and fitness tracking.', 'https://example.com/apple-watch-s9.jpg', 499.00, 0.00, 0.01, 'live', NOW() - INTERVAL '1 minute', 10, FALSE),
      ('QB/1005', 'Nintendo Switch OLED', 'Versatile gaming console with OLED display.', 'https://example.com/switch-oled.jpg', 349.00, 0.00, 0.01, 'upcoming', NOW() + INTERVAL '20 minutes', 10, FALSE);
  `

  try {
    const result = await pool.query(sql)
    console.log(`Inserted ${result.rowCount ?? 0} auctions`)
  } finally {
    await pool.end()
  }
}

seedAuctions()
  .then(() => {
    console.log('Seed completed')
  })
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })


