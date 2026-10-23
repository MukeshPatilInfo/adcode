package com.beershop.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import java.time.LocalDate

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val db = Db(applicationContext)
        setContent { MaterialTheme { App(db) } }
    }
}

private val tabs = listOf("Dashboard", "Stock", "Sell", "Expense", "Earnings")

@Composable
fun App(db: Db) {
    var tab by remember { mutableIntStateOf(0) }
    var date by remember { mutableStateOf(LocalDate.now()) }
    var version by remember { mutableIntStateOf(0) } // bump to refresh after any DB change
    val refresh = { version++ }

    Column(Modifier.fillMaxSize().statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = { date = date.minusDays(1) }) { Text("<") }
            Text(date.toString(), Modifier.weight(1f), fontWeight = FontWeight.Bold)
            TextButton(onClick = { date = LocalDate.now() }) { Text("Today") }
            TextButton(onClick = { date = date.plusDays(1) }) { Text(">") }
        }
        ScrollableTabRow(selectedTabIndex = tab, edgePadding = 0.dp) {
            tabs.forEachIndexed { i, t -> Tab(tab == i, { tab = i }, text = { Text(t) }) }
        }
        Box(Modifier.weight(1f).padding(12.dp)) {
            key(version, date) {
                when (tab) {
                    0 -> Dashboard(db, date)
                    1 -> StockScreen(db, refresh)
                    2 -> SellScreen(db, date, refresh)
                    3 -> ExpenseScreen(db, date, refresh)
                    else -> EarningsScreen(db)
                }
            }
        }
    }
}

fun money(v: Double) = "₹" + String.format("%,.2f", v)

@Composable
fun Dashboard(db: Db, date: LocalDate) {
    val sales = db.salesTotal(date)
    val exp = db.expenseTotal(date)
    LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(12.dp)) {
                    Text("Sales: ${money(sales)} (${db.bottlesSold(date)} bottles)")
                    Text("Expense: ${money(exp)}")
                    Text("Earning: ${money(sales - exp)}", fontWeight = FontWeight.Bold)
                }
            }
            Text("Today's sales", Modifier.padding(top = 8.dp), fontWeight = FontWeight.Bold)
        }
        items(db.sales(date)) { Text("${it.label} x ${it.qty} @ ${money(it.rate)} = ${money(it.qty * it.rate)}") }
        item { Text("Current stock", Modifier.padding(top = 8.dp), fontWeight = FontWeight.Bold) }
        items(db.products()) {
            Text("${it.brand} ${it.sizeMl}ml: ${it.stock}" + if (it.stock <= 5) "  (LOW)" else "")
        }
    }
}

@Composable
fun StockScreen(db: Db, refresh: () -> Unit) {
    var brand by remember { mutableStateOf("") }
    var size by remember { mutableStateOf("") }
    var rate by remember { mutableStateOf("") }
    LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item {
            Text("Add brand / size (or update its rate)", fontWeight = FontWeight.Bold)
            OutlinedTextField(brand, { brand = it }, label = { Text("Brand") }, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(size, { size = it.filter(Char::isDigit) }, label = { Text("Size ml") }, modifier = Modifier.weight(1f))
                OutlinedTextField(rate, { rate = it }, label = { Text("Rate") }, modifier = Modifier.weight(1f))
            }
            Button(onClick = {
                val s = size.toIntOrNull(); val r = rate.toDoubleOrNull()
                if (brand.isNotBlank() && s != null && s > 0 && r != null && r >= 0) {
                    db.saveProduct(brand, s, r); brand = ""; size = ""; rate = ""; refresh()
                }
            }) { Text("Save") }
            HorizontalDivider(Modifier.padding(vertical = 8.dp))
        }
        items(db.products(), key = { it.id }) { p -> ProductRow(db, p, refresh) }
    }
}

@Composable
fun ProductRow(db: Db, p: Product, refresh: () -> Unit) {
    var add by remember { mutableStateOf("") }
    var rate by remember { mutableStateOf(p.rate.toString()) }
    Card(Modifier.fillMaxWidth()) {
        Column(Modifier.padding(8.dp)) {
            Text("${p.brand} ${p.sizeMl}ml   stock: ${p.stock}   rate: ${money(p.rate)}", fontWeight = FontWeight.Bold)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                OutlinedTextField(add, { add = it.filter(Char::isDigit) }, label = { Text("+Stock") }, modifier = Modifier.weight(1f))
                Button(onClick = { add.toIntOrNull()?.let { if (it > 0) { db.addStock(p.id, it); refresh() } } }) { Text("Add") }
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                OutlinedTextField(rate, { rate = it }, label = { Text("Rate") }, modifier = Modifier.weight(1f))
                Button(onClick = { rate.toDoubleOrNull()?.let { if (it >= 0) { db.setRate(p.id, it); refresh() } } }) { Text("Set") }
            }
        }
    }
}

@Composable
fun SellScreen(db: Db, date: LocalDate, refresh: () -> Unit) {
    var msg by remember { mutableStateOf("") }
    LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item { Text("Sell on $date (tap qty, then Sell)", fontWeight = FontWeight.Bold) }
        if (msg.isNotEmpty()) item { Text(msg, color = MaterialTheme.colorScheme.error) }
        items(db.products(), key = { it.id }) { p ->
            var qty by remember { mutableStateOf("1") }
            Card(Modifier.fillMaxWidth()) {
                Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Column(Modifier.weight(2f)) {
                        Text("${p.brand} ${p.sizeMl}ml", fontWeight = FontWeight.Bold)
                        Text("${money(p.rate)} | stock ${p.stock}")
                    }
                    OutlinedTextField(qty, { qty = it.filter(Char::isDigit) }, modifier = Modifier.weight(1f), singleLine = true)
                    Button(onClick = {
                        val q = qty.toIntOrNull() ?: 0
                        if (db.sell(date, p.id, q)) refresh() else msg = "Invalid qty or not enough stock for ${p.brand} ${p.sizeMl}ml"
                    }) { Text("Sell") }
                }
            }
        }
    }
}

@Composable
fun ExpenseScreen(db: Db, date: LocalDate, refresh: () -> Unit) {
    var desc by remember { mutableStateOf("") }
    var amt by remember { mutableStateOf("") }
    LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item {
            Text("Expense on $date", fontWeight = FontWeight.Bold)
            OutlinedTextField(desc, { desc = it }, label = { Text("Description") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(amt, { amt = it }, label = { Text("Amount") }, modifier = Modifier.fillMaxWidth())
            Button(onClick = {
                val a = amt.toDoubleOrNull()
                if (desc.isNotBlank() && a != null && a > 0) { db.addExpense(date, desc, a); desc = ""; amt = ""; refresh() }
            }) { Text("Add expense") }
        }
        items(db.expenses(date)) { Text("${it.description}: ${money(it.amount)}") }
        item { Text("Total: ${money(db.expenseTotal(date))}", fontWeight = FontWeight.Bold) }
    }
}

@Composable
fun EarningsScreen(db: Db) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        item { Text("Date-wise earning (sales - expense)", fontWeight = FontWeight.Bold) }
        items(db.dayTotals()) {
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(8.dp)) {
                    Text(it.date, fontWeight = FontWeight.Bold)
                    Text("Sales ${money(it.sales)} | Expense ${money(it.expense)}")
                    Text("Earning ${money(it.earning)}", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
