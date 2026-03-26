import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer
} from 'recharts';
import { 
  ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, 
  Info, BarChart3, ClipboardList, ArrowRight, RefreshCcw,
  Download, Loader2
} from 'lucide-react';
import { questions, schemas, domains, testData } from './data';
import { SchemaResult } from './types';

// --- Components ---

const IntroScreen = ({ onStart }: { onStart: () => void, key?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-3xl mx-auto bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden"
  >
    <div className="p-6 md:p-12">
      <div className="flex items-center gap-3 mb-4 md:mb-6 text-indigo-600">
        <ClipboardList size={28} className="md:w-8 md:h-8" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Схемный опросник</h1>
      </div>
      <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
        Этот тест поможет вам выявить ваши <strong>ранние дезадаптивные схемы</strong> — устойчивые паттерны мышления и поведения, 
        сформированные в детстве. Понимание своих схем — первый шаг к осознанным изменениям в жизни и отношениях.
      </p>
      
      <div className="bg-indigo-50 rounded-xl md:rounded-2xl p-5 md:p-6 mb-8 border border-indigo-100">
        <h3 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2 text-sm md:text-base">
          <Info size={16} /> Инструкция
        </h3>
        <p className="text-indigo-800 text-xs md:text-sm mb-4">
          Оцените каждое утверждение по шкале от 1 до 6, основываясь на том, насколько оно описывает вас в течение большей части вашей жизни.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(testData.scale).map(([val, label]) => (
            <div key={val} className="text-[10px] md:text-xs text-indigo-700 flex gap-1.5">
              <span className="font-bold">{val}:</span> <span className="leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={onStart}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 group text-base md:text-lg"
      >
        Начать тестирование
        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  </motion.div>
);

const TestScreen = ({ 
  answers, 
  onAnswer, 
  onComplete 
}: { 
  answers: Record<number, number>, 
  onAnswer: (qId: number, val: number) => void,
  onComplete: () => void,
  key?: string
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 5; // Reduced for better mobile focus
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  
  // Ensure we scroll to top whenever the page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const currentQuestions = questions.slice(
    currentPage * questionsPerPage, 
    (currentPage + 1) * questionsPerPage
  );

  const progress = (Object.keys(answers).length / questions.length) * 100;
  const isPageComplete = currentQuestions.every(q => answers[q.id]);
  const isAllComplete = Object.keys(answers).length === questions.length;
  
  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-1">
      {/* Progress Bar */}
      <div className="sticky top-2 z-10 mb-6 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-2 text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider">
          <span>Прогресс: {Math.round(progress)}%</span>
          <span>{Object.keys(answers).length} / {questions.length}</span>
        </div>
        <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-indigo-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentPage}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4 md:space-y-6"
        >
          {currentQuestions.map((q) => (
            <div key={q.id} className="bg-white p-5 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
              <p className="text-base md:text-lg text-gray-800 mb-6 leading-snug">
                <span className="text-indigo-400 font-bold mr-2">#{q.id}</span>
                {q.text}
              </p>
              <div className="grid grid-cols-6 gap-1.5 md:gap-3">
                {[1, 2, 3, 4, 5, 6].map((val) => (
                  <button
                    key={val}
                    onClick={() => onAnswer(q.id, val)}
                    className={`
                      aspect-square rounded-lg md:rounded-xl font-bold transition-all text-sm md:text-lg
                      ${answers[q.id] === val 
                        ? 'bg-indigo-600 text-white scale-105 shadow-md' 
                        : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 active:bg-indigo-100'}
                    `}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-3 text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <span>Совсем нет</span>
                <span>Точно да</span>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-3 justify-between items-center mt-8 mb-16">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="w-full md:w-auto order-2 md:order-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-20 transition-all"
        >
          <ChevronLeft size={20} /> Назад
        </button>

        {currentPage === totalPages - 1 ? (
          <button
            onClick={onComplete}
            disabled={!isAllComplete}
            className={`
              w-full md:w-auto order-1 md:order-2 flex items-center justify-center gap-2 px-8 py-4 rounded-xl md:rounded-2xl font-bold transition-all
              ${isAllComplete 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
            `}
          >
            Показать результат <CheckCircle2 size={20} />
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isPageComplete}
            className={`
              w-full md:w-auto order-1 md:order-2 flex items-center justify-center gap-2 px-8 py-4 rounded-xl md:rounded-2xl font-bold transition-all
              ${isPageComplete 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg' 
                : 'bg-indigo-100 text-indigo-300 cursor-not-allowed'}
            `}
          >
            Далее <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

const ResultsScreen = ({ results, onReset }: { results: SchemaResult[], onReset: () => void, key?: string }) => {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const significantSchemas = results.filter(r => r.isSignificant);
  const chartData = results.map(r => ({
    subject: r.schemaName,
    A: r.averageScore,
    fullMark: 6,
  }));

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;
    setIsGenerating(true);
    
    try {
      // Small delay to ensure everything is rendered
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc', // Matches bg-slate-50
        windowWidth: 1200, // Fixed width for consistent PDF layout
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate how many pages we need
      const ratio = pdfWidth / imgWidth;
      const canvasPageHeight = pdfHeight / ratio;
      let heightLeft = imgHeight;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight * ratio);
      heightLeft -= canvasPageHeight;
      
      // Subsequent pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position * ratio, pdfWidth, imgHeight * ratio);
        heightLeft -= canvasPageHeight;
      }
      
      pdf.save(`YSQ-Results-${new Date().toLocaleDateString()}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Произошла ошибка при создании PDF. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-12 pb-20">
      <div ref={resultsRef} className="space-y-8 md:space-y-12 p-2 md:p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ваш профиль схем</h1>
          <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Ниже представлена визуализация ваших результатов. Схемы с баллом выше 4.0 считаются клинически значимыми.
          </p>
        </motion.div>

        {/* Radar Chart */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-xl border border-gray-100 h-[350px] md:h-[500px]">
          <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} /> Общая картина
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b' }} />
              <PolarRadiusAxis angle={30} domain={[0, 6]} tick={{ fontSize: 8 }} />
              <Radar
                name="Баллы"
                dataKey="A"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Red Zone Summary */}
        {significantSchemas.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl md:rounded-3xl p-6 md:p-8 mx-1">
            <h3 className="text-red-900 text-lg md:text-xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle size={20} /> Красная зона: Выраженные схемы
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {significantSchemas.map(s => (
                <div key={s.schemaId} className="bg-white p-4 rounded-xl md:rounded-2xl shadow-sm border border-red-200">
                  <div className="text-red-600 font-bold mb-1 text-sm md:text-base leading-tight">{s.schemaName}</div>
                  <div className="text-[9px] md:text-xs text-gray-400 uppercase font-bold mb-2 tracking-wider">{s.domainName}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(s.averageScore / 6) * 100}%` }} />
                    </div>
                    <span className="text-xs md:text-sm font-bold text-red-700">{s.averageScore.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Interpretation */}
        <div className="space-y-6 md:space-y-8 px-1">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 px-3">Подробная интерпретация</h3>
          {results.filter(r => r.averageScore > 3.5).map((r) => (
            <motion.div 
              key={r.schemaId}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-indigo-900 leading-tight">{r.schemaName}</h4>
                  <p className="text-[10px] md:text-sm text-indigo-400 font-bold uppercase tracking-widest mt-1">{r.domainName}</p>
                </div>
                <div className="bg-indigo-50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-indigo-700 font-bold text-sm md:text-base inline-block self-start">
                  Средний балл: {r.averageScore.toFixed(1)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="space-y-2">
                  <h5 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full" /> Суть
                  </h5>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{r.interpretation.essence}</p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                    <span className="w-2 h-2 bg-red-500 rounded-full" /> Как это мешает
                  </h5>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{r.interpretation.interference}</p>
                </div>
                <div className="space-y-2">
                  <h5 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                    <span className="w-2 h-2 bg-green-500 rounded-full" /> Точка роста
                  </h5>
                  <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{r.interpretation.growthPoint}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Формирование PDF...
            </>
          ) : (
            <>
              <Download size={20} /> Сохранить результаты в PDF
            </>
          )}
        </button>
        
        <button 
          onClick={onReset}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 px-8 rounded-xl md:rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <RefreshCcw size={20} /> Пройти тест заново
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<'intro' | 'test' | 'results'>('intro');
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Global scroll to top on screen change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screen]);

  const calculateResults = (ans: Record<number, number>): SchemaResult[] => {
    return schemas.map(schema => {
      const schemaQuestions = questions.filter(q => q.schemaId === schema.id);
      const schemaAnswers = schemaQuestions.map(q => ans[q.id] || 0);
      const sum = schemaAnswers.reduce((a, b) => a + b, 0);
      const average = sum / schemaQuestions.length;
      
      // Clinical significance: avg >= 4.0 OR at least two answers are 5 or 6
      const highScoresCount = schemaAnswers.filter(a => a >= 5).length;
      const isSignificant = average >= 4.0 || highScoresCount >= 2;

      const domain = domains.find(d => d.id === schema.domainId);

      return {
        schemaId: schema.id,
        schemaName: schema.name,
        domainName: domain?.name || 'Unknown',
        averageScore: average,
        isSignificant,
        interpretation: schema.detailedInterpretation
      };
    });
  };

  const results = useMemo(() => calculateResults(answers), [answers]);

  const handleAnswer = (qId: number, val: number) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleReset = () => {
    setAnswers({});
    setScreen('intro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 py-6 md:py-12 px-3 md:px-4 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="container mx-auto">
        <AnimatePresence mode="wait">
          {screen === 'intro' && (
            <IntroScreen key="intro" onStart={() => setScreen('test')} />
          )}
          {screen === 'test' && (
            <TestScreen 
              key="test" 
              answers={answers} 
              onAnswer={handleAnswer} 
              onComplete={() => {
                setScreen('results');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
          )}
          {screen === 'results' && (
            <ResultsScreen 
              key="results" 
              results={results} 
              onReset={handleReset} 
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
