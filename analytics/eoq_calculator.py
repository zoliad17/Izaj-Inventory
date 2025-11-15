import math
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Tuple
import numpy as np
from scipy import stats


@dataclass
class EOQInput:
    """Input parameters for EOQ calculation"""
    annual_demand: float
    holding_cost: float  # Cost to hold one unit per year
    ordering_cost: float  # Cost per order
    unit_cost: float  # Cost per unit
    lead_time_days: int = 7
    confidence_level: float = 0.95


@dataclass
class EOQResult:
    """EOQ calculation results"""
    eoq_quantity: float
    reorder_point: float
    safety_stock: float
    annual_holding_cost: float
    annual_ordering_cost: float
    total_annual_cost: float
    max_stock_level: float
    min_stock_level: float
    average_inventory: float


class EOQCalculator:
    """
    Economic Order Quantity Calculator with safety stock and predictive analytics
    
    EOQ Formula: √(2 × D × S / H)
    Where:
    - D = Annual demand
    - S = Ordering cost per order
    - H = Holding cost per unit per year
    """
    
    @staticmethod
    def calculate_eoq(eoq_input: EOQInput) -> EOQResult:
        """Calculate Economic Order Quantity and related metrics"""
        
        # Validate inputs
        if eoq_input.annual_demand <= 0:
            raise ValueError("Annual demand must be greater than 0")
        if eoq_input.holding_cost <= 0:
            raise ValueError("Holding cost must be greater than 0")
        if eoq_input.ordering_cost < 0:
            raise ValueError("Ordering cost cannot be negative")
        if eoq_input.unit_cost < 0:
            raise ValueError("Unit cost cannot be negative")
        
        # Basic EOQ Calculation
        numerator = 2 * eoq_input.annual_demand * eoq_input.ordering_cost
        denominator = eoq_input.holding_cost
        
        eoq = math.sqrt(numerator / denominator)
        
        # Average daily demand
        avg_daily_demand = eoq_input.annual_demand / 365
        
        # Standard deviation estimation (assuming 20% coefficient of variation)
        std_dev = avg_daily_demand * 0.2
        
        # Z-score for confidence level
        z_score = EOQCalculator._get_z_score(eoq_input.confidence_level)
        
        # Safety stock calculation: Z × σ × √L
        # where L = lead time in days
        safety_stock = z_score * std_dev * math.sqrt(eoq_input.lead_time_days)
        
        # Reorder point = (Average daily demand × Lead time) + Safety stock
        reorder_point = (avg_daily_demand * eoq_input.lead_time_days) + safety_stock
        
        # Costs calculation
        annual_holding_cost = (eoq / 2) * eoq_input.holding_cost
        annual_ordering_cost = (eoq_input.annual_demand / eoq) * eoq_input.ordering_cost
        total_annual_cost = annual_holding_cost + annual_ordering_cost
        
        # Stock levels
        max_stock_level = reorder_point + eoq
        min_stock_level = safety_stock
        average_inventory = (eoq / 2) + safety_stock
        
        return EOQResult(
            eoq_quantity=round(eoq, 2),
            reorder_point=round(reorder_point, 2),
            safety_stock=round(safety_stock, 2),
            annual_holding_cost=round(annual_holding_cost, 2),
            annual_ordering_cost=round(annual_ordering_cost, 2),
            total_annual_cost=round(total_annual_cost, 2),
            max_stock_level=round(max_stock_level, 2),
            min_stock_level=round(min_stock_level, 2),
            average_inventory=round(average_inventory, 2)
        )
    
    @staticmethod
    def _get_z_score(confidence_level: float) -> float:
        """Get Z-score for given confidence level"""
        if confidence_level < 0 or confidence_level > 1:
            raise ValueError("Confidence level must be between 0 and 1")
        return stats.norm.ppf((1 + confidence_level) / 2)
    
    @staticmethod
    def calculate_holding_cost(unit_cost: float, holding_cost_percentage: float = 0.25) -> float:
        """
        Calculate annual holding cost
        Typical holding cost is 20-30% of unit cost
        """
        if holding_cost_percentage < 0 or holding_cost_percentage > 1:
            raise ValueError("Holding cost percentage must be between 0 and 1")
        return unit_cost * holding_cost_percentage
    
    @staticmethod
    def calculate_ordering_cost(products_per_order: int, fixed_cost: float = 50, 
                               variable_cost_per_item: float = 0.5) -> float:
        """Calculate cost per order"""
        if products_per_order < 0:
            raise ValueError("Products per order cannot be negative")
        return fixed_cost + (products_per_order * variable_cost_per_item)


class DemandForecaster:
    """Forecast future demand using multiple methods"""
    
    @staticmethod
    def simple_moving_average(data: List[float], periods: int = 3) -> List[float]:
        """Simple Moving Average forecast"""
        if len(data) < periods:
            return data
        
        forecasts = []
        for i in range(len(data) - periods + 1):
            avg = sum(data[i:i + periods]) / periods
            forecasts.append(avg)
        
        return forecasts
    
    @staticmethod
    def exponential_smoothing(data: List[float], alpha: float = 0.3) -> List[float]:
        """
        Exponential Smoothing forecast
        alpha: smoothing factor (0-1), higher = more weight on recent data
        """
        if not data:
            return []
        
        if alpha < 0 or alpha > 1:
            raise ValueError("Alpha must be between 0 and 1")
        
        forecasts = [data[0]]
        
        for i in range(1, len(data)):
            forecast = alpha * data[i-1] + (1 - alpha) * forecasts[i-1]
            forecasts.append(forecast)
        
        return forecasts
    
    @staticmethod
    def seasonal_decomposition(data: List[float], periods: int = 12) -> Dict[str, List[float]]:
        """
        Decompose time series into trend and seasonal components
        Useful for products with seasonal demand patterns
        """
        if len(data) < periods * 2:
            return {"trend": data, "seasonal": [0] * len(data)}
        
        # Calculate trend using moving average
        trend = []
        for i in range(len(data)):
            start = max(0, i - periods // 2)
            end = min(len(data), i + periods // 2 + 1)
            trend.append(sum(data[start:end]) / (end - start))
        
        # Calculate seasonal component
        seasonal = [data[i] - trend[i] for i in range(len(data))]
        
        return {
            "trend": trend,
            "seasonal": seasonal,
            "original": data
        }
    
    @staticmethod
    def forecast_multiple_periods(data: List[float], periods_ahead: int = 3, 
                                 method: str = "exponential") -> Dict:
        """Forecast demand for multiple periods ahead"""
        if not data:
            raise ValueError("Data cannot be empty")
        
        if periods_ahead <= 0:
            raise ValueError("Periods ahead must be greater than 0")
        
        if method == "moving_average":
            base_forecast = DemandForecaster.simple_moving_average(data, 3)[-1] if len(data) >= 3 else data[-1]
        else:
            smoothed = DemandForecaster.exponential_smoothing(data, 0.3)
            base_forecast = smoothed[-1]
        
        # Calculate trend
        trend = (data[-1] - data[0]) / len(data)
        
        forecasts = []
        for i in range(1, periods_ahead + 1):
            forecast = base_forecast + (trend * i)
            forecasts.append(max(0, forecast))
        
        return {
            "forecasts": forecasts,
            "trend": trend,
            "base_forecast": base_forecast,
            "confidence_intervals": DemandForecaster._calculate_confidence_intervals(data, forecasts)
        }
    
    @staticmethod
    def _calculate_confidence_intervals(historical_data: List[float], 
                                       forecasts: List[float], 
                                       confidence: float = 0.95) -> Dict[str, List]:
        """Calculate confidence intervals for forecasts"""
        if not historical_data:
            return {"lower": [], "upper": []}
        
        std_error = np.std(historical_data) * 1.96  # 95% confidence
        
        lower_bounds = [max(0, f - std_error) for f in forecasts]
        upper_bounds = [f + std_error for f in forecasts]
        
        return {
            "lower": lower_bounds,
            "upper": upper_bounds
        }


class InventoryAnalytics:
    """Comprehensive inventory analysis and recommendations"""
    
    @staticmethod
    def analyze_inventory_health(current_stock: float, daily_usage: float, 
                                reorder_point: float, safety_stock: float,
                                eoq: float) -> Dict:
        """Analyze current inventory health status"""
        
        if daily_usage < 0:
            raise ValueError("Daily usage cannot be negative")
        
        if current_stock < 0:
            raise ValueError("Current stock cannot be negative")
        
        if daily_usage <= 0:
            days_of_stock = float('inf')
        else:
            days_of_stock = current_stock / daily_usage
        
        # Determine stock status
        if current_stock <= safety_stock:
            status = "CRITICAL"
            risk_level = "HIGH"
        elif current_stock <= reorder_point:
            status = "LOW"
            risk_level = "MEDIUM"
        elif current_stock >= reorder_point + eoq:
            status = "HIGH"
            risk_level = "LOW"
        else:
            status = "NORMAL"
            risk_level = "LOW"
        
        # Calculate stockout risk percentage
        if current_stock <= 0:
            stockout_risk = 100.0
        else:
            total_capacity = reorder_point + eoq
            if total_capacity > 0:
                stockout_risk = max(0, (1 - (current_stock / total_capacity)) * 100)
            else:
                stockout_risk = 0
        
        return {
            "status": status,
            "risk_level": risk_level,
            "days_of_stock": round(days_of_stock, 2),
            "stockout_risk_percentage": round(stockout_risk, 2),
            "recommendation": InventoryAnalytics._get_recommendation(status, current_stock, reorder_point, eoq)
        }
    
    @staticmethod
    def _get_recommendation(status: str, current_stock: float, 
                           reorder_point: float, eoq: float) -> str:
        """Get inventory management recommendation"""
        recommendations = {
            "CRITICAL": f"URGENT: Order {int(eoq)} units immediately to reach optimal stock levels",
            "LOW": f"CAUTION: Place order for {int(eoq)} units. Current stock below reorder point ({int(reorder_point)})",
            "NORMAL": f"Maintain current stock. Next order recommended when stock reaches {int(reorder_point)}",
            "HIGH": "Excess inventory detected. Consider reducing order quantity or frequency"
        }
        return recommendations.get(status, "Monitor inventory levels")
    
    @staticmethod
    def calculate_turnover_ratio(annual_demand: float, average_inventory: float) -> float:
        """
        Calculate inventory turnover ratio
        Higher ratio = better inventory management
        """
        if average_inventory <= 0:
            return 0
        return round(annual_demand / average_inventory, 2)
    
    @staticmethod
    def calculate_abc_analysis(products: List[Dict]) -> Dict[str, List]:
        """
        ABC Analysis - Classify products by value
        A: High value items (top 80% of value)
        B: Medium value items (next 15% of value)
        C: Low value items (remaining 5%)
        """
        if not products:
            return {"A_items": [], "B_items": [], "C_items": []}
        
        # Calculate total value for each product
        product_values = [(p['id'], p.get('annual_demand', 0) * p.get('unit_cost', 0)) for p in products]
        product_values.sort(key=lambda x: x[1], reverse=True)
        
        total_value = sum(v[1] for v in product_values)
        
        if total_value == 0:
            return {"A_items": [], "B_items": [], "C_items": [p['id'] for p in products]}
        
        a_items = []
        b_items = []
        c_items = []
        cumulative_value = 0
        
        for product_id, value in product_values:
            cumulative_percentage = (cumulative_value / total_value) * 100
            
            if cumulative_percentage < 80:
                a_items.append(product_id)
            elif cumulative_percentage < 95:
                b_items.append(product_id)
            else:
                c_items.append(product_id)
            
            cumulative_value += value
        
        return {
            "A_items": a_items,  # Frequent monitoring
            "B_items": b_items,  # Regular monitoring
            "C_items": c_items,  # Periodic monitoring
        }
