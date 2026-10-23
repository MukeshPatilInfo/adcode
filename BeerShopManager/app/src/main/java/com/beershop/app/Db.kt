package com.beershop.app

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.time.LocalDate

data class Product(val id: Long, val brand: String, val sizeMl: Int, val rate: Double, val stock: Int)
data class SaleRow(val id: Long, val label: String, val qty: Int, val rate: Double)
data class ExpenseRow(val id: Long, val description: String, val amount: Double)
data class DayTotal(val date: String, val sales: Double, val expense: Double) {
    val earning get() = sales - expense
}

class Db(context: Context) : SQLiteOpenHelper(context, "beershop.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE product(id INTEGER PRIMARY KEY AUTOINCREMENT, brand TEXT NOT NULL, " +
                "size_ml INTEGER NOT NULL, rate REAL NOT NULL DEFAULT 0, stock INTEGER NOT NULL DEFAULT 0, " +
                "UNIQUE(brand, size_ml))"
        )
        db.execSQL(
            "CREATE TABLE sale(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, " +
                "product_id INTEGER NOT NULL, qty INTEGER NOT NULL, rate REAL NOT NULL)"
        )
        db.execSQL(
            "CREATE TABLE expense(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, " +
                "description TEXT NOT NULL, amount REAL NOT NULL)"
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, o: Int, n: Int) {}

    /** Adds a brand/size with rate; if it already exists, updates the rate. */
    fun saveProduct(brand: String, sizeMl: Int, rate: Double) {
        val w = writableDatabase
        val cv = ContentValues().apply {
            put("brand", brand.trim()); put("size_ml", sizeMl); put("rate", rate)
        }
        val updated = w.update("product", ContentValues().apply { put("rate", rate) },
            "brand = ? COLLATE NOCASE AND size_ml = ?", arrayOf(brand.trim(), sizeMl.toString()))
        if (updated == 0) w.insert("product", null, cv)
    }

    fun setRate(id: Long, rate: Double) {
        writableDatabase.update("product", ContentValues().apply { put("rate", rate) }, "id = ?", arrayOf(id.toString()))
    }

    fun addStock(id: Long, qty: Int) {
        writableDatabase.execSQL("UPDATE product SET stock = stock + ? WHERE id = ?", arrayOf(qty, id))
    }

    fun products(): List<Product> {
        val out = mutableListOf<Product>()
        readableDatabase.rawQuery("SELECT id, brand, size_ml, rate, stock FROM product ORDER BY brand COLLATE NOCASE, size_ml", null).use {
            while (it.moveToNext()) out.add(Product(it.getLong(0), it.getString(1), it.getInt(2), it.getDouble(3), it.getInt(4)))
        }
        return out
    }

    /** Records a sale at the current rate. Returns false if stock is insufficient. */
    fun sell(date: LocalDate, productId: Long, qty: Int): Boolean {
        val w = writableDatabase
        w.beginTransaction()
        try {
            var rate = 0.0
            var stock = 0
            w.rawQuery("SELECT rate, stock FROM product WHERE id = ?", arrayOf(productId.toString())).use {
                if (!it.moveToFirst()) return false
                rate = it.getDouble(0); stock = it.getInt(1)
            }
            if (qty <= 0 || qty > stock) return false
            w.execSQL("UPDATE product SET stock = stock - ? WHERE id = ?", arrayOf(qty, productId))
            w.insert("sale", null, ContentValues().apply {
                put("date", date.toString()); put("product_id", productId); put("qty", qty); put("rate", rate)
            })
            w.setTransactionSuccessful()
            return true
        } finally {
            w.endTransaction()
        }
    }

    fun sales(date: LocalDate): List<SaleRow> {
        val out = mutableListOf<SaleRow>()
        readableDatabase.rawQuery(
            "SELECT s.id, p.brand || ' ' || p.size_ml || 'ml', s.qty, s.rate FROM sale s " +
                "JOIN product p ON p.id = s.product_id WHERE s.date = ? ORDER BY s.id DESC", arrayOf(date.toString())
        ).use { while (it.moveToNext()) out.add(SaleRow(it.getLong(0), it.getString(1), it.getInt(2), it.getDouble(3))) }
        return out
    }

    fun addExpense(date: LocalDate, description: String, amount: Double) {
        writableDatabase.insert("expense", null, ContentValues().apply {
            put("date", date.toString()); put("description", description.trim()); put("amount", amount)
        })
    }

    fun expenses(date: LocalDate): List<ExpenseRow> {
        val out = mutableListOf<ExpenseRow>()
        readableDatabase.rawQuery("SELECT id, description, amount FROM expense WHERE date = ? ORDER BY id DESC", arrayOf(date.toString()))
            .use { while (it.moveToNext()) out.add(ExpenseRow(it.getLong(0), it.getString(1), it.getDouble(2))) }
        return out
    }

    fun salesTotal(date: LocalDate) = scalar("SELECT COALESCE(SUM(qty * rate), 0) FROM sale WHERE date = ?", date.toString())
    fun expenseTotal(date: LocalDate) = scalar("SELECT COALESCE(SUM(amount), 0) FROM expense WHERE date = ?", date.toString())
    fun bottlesSold(date: LocalDate) = scalar("SELECT COALESCE(SUM(qty), 0) FROM sale WHERE date = ?", date.toString()).toInt()

    private fun scalar(sql: String, arg: String): Double =
        readableDatabase.rawQuery(sql, arrayOf(arg)).use { if (it.moveToFirst()) it.getDouble(0) else 0.0 }

    /** Date-wise sales, expense and earning, newest first. */
    fun dayTotals(): List<DayTotal> {
        val sales = mutableMapOf<String, Double>()
        val exp = mutableMapOf<String, Double>()
        readableDatabase.rawQuery("SELECT date, SUM(qty * rate) FROM sale GROUP BY date", null).use {
            while (it.moveToNext()) sales[it.getString(0)] = it.getDouble(1)
        }
        readableDatabase.rawQuery("SELECT date, SUM(amount) FROM expense GROUP BY date", null).use {
            while (it.moveToNext()) exp[it.getString(0)] = it.getDouble(1)
        }
        return (sales.keys + exp.keys).sortedDescending().map { DayTotal(it, sales[it] ?: 0.0, exp[it] ?: 0.0) }
    }
}
