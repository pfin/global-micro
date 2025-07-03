#include <emscripten/bind.h>
#include <ql/quantlib.hpp>
#include <vector>
#include <string>
#include <memory>

using namespace QuantLib;
using namespace emscripten;

// Helper function to convert Date to ISO string
std::string dateToISOString(const Date& date) {
    std::stringstream stream;
    stream << date.year() << "-" 
           << std::setfill('0') << std::setw(2) << static_cast<int>(date.month()) << "-"
           << std::setfill('0') << std::setw(2) << date.dayOfMonth();
    return stream.str();
}

// Helper function to create Date from ISO string
Date dateFromISOString(const std::string& s) {
    int y, m, d;
    sscanf(s.c_str(), "%d-%d-%d", &y, &m, &d);
    return Date(d, static_cast<Month>(m), y);
}

// Wrapper for YieldTermStructure
class YieldCurveWrapper {
private:
    std::vector<Date> dates_;
    std::vector<DiscountFactor> discountFactors_;
    DayCounter dayCounter_;
    Handle<YieldTermStructure> termStructure_;
    
public:
    YieldCurveWrapper() : dayCounter_(Actual360()) {}
    
    void addPoint(const std::string& dateStr, double discountFactor) {
        dates_.push_back(dateFromISOString(dateStr));
        discountFactors_.push_back(discountFactor);
    }
    
    void build() {
        if (dates_.size() < 2) {
            throw std::runtime_error("Need at least 2 points to build yield curve");
        }
        
        boost::shared_ptr<YieldTermStructure> curve(
            new InterpolatedDiscountCurve<LogLinear>(
                dates_, discountFactors_, dayCounter_
            )
        );
        termStructure_ = Handle<YieldTermStructure>(curve);
    }
    
    double discount(const std::string& dateStr) {
        Date d = dateFromISOString(dateStr);
        return termStructure_->discount(d);
    }
    
    double zeroRate(const std::string& dateStr, int compounding, int frequency) {
        Date d = dateFromISOString(dateStr);
        return termStructure_->zeroRate(d, dayCounter_, 
            static_cast<Compounding>(compounding), 
            static_cast<Frequency>(frequency)).rate();
    }
    
    double forwardRate(const std::string& date1Str, const std::string& date2Str, 
                      int compounding, int frequency) {
        Date d1 = dateFromISOString(date1Str);
        Date d2 = dateFromISOString(date2Str);
        return termStructure_->forwardRate(d1, d2, dayCounter_,
            static_cast<Compounding>(compounding),
            static_cast<Frequency>(frequency)).rate();
    }
    
    void clear() {
        dates_.clear();
        discountFactors_.clear();
    }
    
    int getPointCount() const {
        return dates_.size();
    }
};

// Simple yield curve for basic interpolation
class SimpleYieldCurve {
private:
    std::vector<double> times_;
    std::vector<double> rates_;
    
public:
    void addPoint(double time, double rate) {
        times_.push_back(time);
        rates_.push_back(rate);
    }
    
    double interpolateRate(double time) {
        if (times_.empty()) return 0.0;
        if (times_.size() == 1) return rates_[0];
        
        // Linear interpolation
        for (size_t i = 1; i < times_.size(); ++i) {
            if (time <= times_[i]) {
                double t0 = times_[i-1];
                double t1 = times_[i];
                double r0 = rates_[i-1];
                double r1 = rates_[i];
                
                double alpha = (time - t0) / (t1 - t0);
                return r0 + alpha * (r1 - r0);
            }
        }
        
        return rates_.back();
    }
    
    double discount(double time) {
        double rate = interpolateRate(time);
        return std::exp(-rate * time);
    }
    
    int getPointCount() const {
        return times_.size();
    }
    
    void clear() {
        times_.clear();
        rates_.clear();
    }
};

// Bindings
EMSCRIPTEN_BINDINGS(quantlib_module) {
    // Helper functions
    function("dateToISOString", &dateToISOString);
    function("dateFromISOString", &dateFromISOString);
    function("todaysDate", []() { return dateToISOString(Date::todaysDate()); });
    
    // Date class
    class_<Date>("Date")
        .constructor<>()
        .constructor<int, int, int>()
        .function("dayOfMonth", &Date::dayOfMonth)
        .function("month", select_overload<Month() const>(&Date::month))
        .function("year", &Date::year)
        .function("serialNumber", &Date::serialNumber)
        .function("weekday", select_overload<Weekday() const>(&Date::weekday))
        .function("toString", &dateToISOString);
    
    // Enums
    enum_<Compounding>("Compounding")
        .value("Simple", Simple)
        .value("Compounded", Compounded)
        .value("Continuous", Continuous)
        .value("SimpleThenCompounded", SimpleThenCompounded);
        
    enum_<Frequency>("Frequency")
        .value("NoFrequency", NoFrequency)
        .value("Once", Once)
        .value("Annual", Annual)
        .value("Semiannual", Semiannual)
        .value("EveryFourthMonth", EveryFourthMonth)
        .value("Quarterly", Quarterly)
        .value("Bimonthly", Bimonthly)
        .value("Monthly", Monthly)
        .value("EveryFourthWeek", EveryFourthWeek)
        .value("Biweekly", Biweekly)
        .value("Weekly", Weekly)
        .value("Daily", Daily);
    
    // Simple yield curve (no QuantLib dependencies for basic use)
    class_<SimpleYieldCurve>("SimpleYieldCurve")
        .constructor<>()
        .function("addPoint", &SimpleYieldCurve::addPoint)
        .function("interpolateRate", &SimpleYieldCurve::interpolateRate)
        .function("discount", &SimpleYieldCurve::discount)
        .function("getPointCount", &SimpleYieldCurve::getPointCount)
        .function("clear", &SimpleYieldCurve::clear);
    
    // Full QuantLib yield curve wrapper
    class_<YieldCurveWrapper>("YieldCurve")
        .constructor<>()
        .function("addPoint", &YieldCurveWrapper::addPoint)
        .function("build", &YieldCurveWrapper::build)
        .function("discount", &YieldCurveWrapper::discount)
        .function("zeroRate", &YieldCurveWrapper::zeroRate)
        .function("forwardRate", &YieldCurveWrapper::forwardRate)
        .function("clear", &YieldCurveWrapper::clear)
        .function("getPointCount", &YieldCurveWrapper::getPointCount);
}